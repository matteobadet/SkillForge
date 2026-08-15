using Microsoft.EntityFrameworkCore;
using SkillForge.Api.Data;
using SkillForge.Api.Models;
using SkillForge.Api.Services;
using Xunit;

namespace SkillForge.Api.Tests;

public class TeamServiceTests
{
    private static (AppDbContext db, TeamService service) CreateService()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options);
        return (db, new TeamService(db));
    }

    private static async Task<User> AddUserAsync(AppDbContext db, string email, string pseudo)
    {
        var user = new User { Email = email, Pseudo = pseudo, PasswordHash = "x" };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task CreateTeamAsync_MakesCreatorOwner()
    {
        var (db, service) = CreateService();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");

        var team = await service.CreateTeamAsync(owner.Id, "Team A", null, TeamVisibility.Public);

        var role = await service.GetMemberRoleAsync(team.Id, owner.Id);
        Assert.Equal(TeamRole.Owner, role);
    }

    [Fact]
    public async Task JoinByTokenAsync_IsIdempotent_WhenAlreadyMember()
    {
        var (db, service) = CreateService();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var member = await AddUserAsync(db, "member@test.com", "member");
        var team = await service.CreateTeamAsync(owner.Id, "Team A", null, TeamVisibility.Prive);
        var token = await service.RegenerateInviteLinkAsync(team.Id);

        await service.JoinByTokenAsync(token, member.Id);
        await service.JoinByTokenAsync(token, member.Id);

        var memberCount = await db.TeamMembers.CountAsync(m => m.TeamId == team.Id);
        Assert.Equal(2, memberCount); // owner + member, no duplicate
    }

    [Fact]
    public async Task RegenerateInviteLinkAsync_RevokesPreviousToken()
    {
        var (db, service) = CreateService();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var member = await AddUserAsync(db, "member@test.com", "member");
        var team = await service.CreateTeamAsync(owner.Id, "Team A", null, TeamVisibility.Prive);

        var oldToken = await service.RegenerateInviteLinkAsync(team.Id);
        await service.RegenerateInviteLinkAsync(team.Id);

        var result = await service.JoinByTokenAsync(oldToken, member.Id);
        Assert.Null(result);
    }

    [Fact]
    public async Task VisibleTeamsQuery_HidesPrivateTeams_FromNonMembers()
    {
        var (db, service) = CreateService();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var outsider = await AddUserAsync(db, "outsider@test.com", "outsider");
        await service.CreateTeamAsync(owner.Id, "Public Team", null, TeamVisibility.Public);
        await service.CreateTeamAsync(owner.Id, "Private Team", null, TeamVisibility.Prive);

        var visibleToOutsider = await service.VisibleTeamsQuery(outsider.Id, isAdmin: false).ToListAsync();

        Assert.Single(visibleToOutsider);
        Assert.Equal("Public Team", visibleToOutsider[0].Name);
    }

    [Fact]
    public async Task VisibleTeamsQuery_ShowsAllTeams_ToAdmin()
    {
        var (db, service) = CreateService();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var admin = await AddUserAsync(db, "admin@test.com", "admin");
        await service.CreateTeamAsync(owner.Id, "Public Team", null, TeamVisibility.Public);
        await service.CreateTeamAsync(owner.Id, "Private Team", null, TeamVisibility.Prive);

        var visibleToAdmin = await service.VisibleTeamsQuery(admin.Id, isAdmin: true).ToListAsync();

        Assert.Equal(2, visibleToAdmin.Count);
    }
}
