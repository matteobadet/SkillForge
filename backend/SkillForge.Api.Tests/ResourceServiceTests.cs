using Microsoft.EntityFrameworkCore;
using SkillForge.Api.Data;
using SkillForge.Api.Models;
using SkillForge.Api.Services;
using Xunit;

namespace SkillForge.Api.Tests;

public class ResourceServiceTests
{
    private static (AppDbContext db, ResourceService resources, TeamService teams) CreateServices()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options);
        var teamService = new TeamService(db);
        return (db, new ResourceService(db, teamService), teamService);
    }

    private static async Task<User> AddUserAsync(AppDbContext db, string email, string pseudo)
    {
        var user = new User { Email = email, Pseudo = pseudo, PasswordHash = "x" };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task CanManageAsync_TrueForPublisher()
    {
        var (db, resources, teams) = CreateServices();
        var publisher = await AddUserAsync(db, "pub@test.com", "pub");
        var team = await teams.CreateTeamAsync(publisher.Id, "Team", null, TeamVisibility.Public);
        var resource = await resources.CreateResourceAsync(team.Id, publisher.Id, "Res", null, ResourceType.Skill, "key");

        Assert.True(await resources.CanManageAsync(resource, publisher.Id));
    }

    [Fact]
    public async Task CanManageAsync_TrueForTeamOwner_EvenIfNotPublisher()
    {
        var (db, resources, teams) = CreateServices();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var member = await AddUserAsync(db, "member@test.com", "member");
        var team = await teams.CreateTeamAsync(owner.Id, "Team", null, TeamVisibility.Public);
        var link = await teams.RegenerateInviteLinkAsync(team.Id);
        await teams.JoinByTokenAsync(link, member.Id);
        var resource = await resources.CreateResourceAsync(team.Id, member.Id, "Res", null, ResourceType.Skill, "key");

        Assert.True(await resources.CanManageAsync(resource, owner.Id));
    }

    [Fact]
    public async Task CanManageAsync_FalseForOtherMember()
    {
        var (db, resources, teams) = CreateServices();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var publisher = await AddUserAsync(db, "pub@test.com", "pub");
        var other = await AddUserAsync(db, "other@test.com", "other");
        var team = await teams.CreateTeamAsync(owner.Id, "Team", null, TeamVisibility.Public);
        var resource = await resources.CreateResourceAsync(team.Id, publisher.Id, "Res", null, ResourceType.Skill, "key");

        Assert.False(await resources.CanManageAsync(resource, other.Id));
    }

    [Fact]
    public async Task ToggleUpvoteAsync_TogglesOnThenOff()
    {
        var (db, resources, teams) = CreateServices();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var voter = await AddUserAsync(db, "voter@test.com", "voter");
        var team = await teams.CreateTeamAsync(owner.Id, "Team", null, TeamVisibility.Public);
        var resource = await resources.CreateResourceAsync(team.Id, owner.Id, "Res", null, ResourceType.Skill, "key");

        var (countAfterFirst, upvotedAfterFirst) = await resources.ToggleUpvoteAsync(resource.Id, voter.Id);
        Assert.Equal(1, countAfterFirst);
        Assert.True(upvotedAfterFirst);

        var (countAfterSecond, upvotedAfterSecond) = await resources.ToggleUpvoteAsync(resource.Id, voter.Id);
        Assert.Equal(0, countAfterSecond);
        Assert.False(upvotedAfterSecond);
    }

    [Fact]
    public async Task VisibleResourcesQuery_HidesResourcesOfPrivateTeams_FromNonMembers()
    {
        var (db, resources, teams) = CreateServices();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var outsider = await AddUserAsync(db, "outsider@test.com", "outsider");
        var publicTeam = await teams.CreateTeamAsync(owner.Id, "Public Team", null, TeamVisibility.Public);
        var privateTeam = await teams.CreateTeamAsync(owner.Id, "Private Team", null, TeamVisibility.Prive);
        await resources.CreateResourceAsync(publicTeam.Id, owner.Id, "Public Res", null, ResourceType.Skill, "key1");
        await resources.CreateResourceAsync(privateTeam.Id, owner.Id, "Private Res", null, ResourceType.Skill, "key2");

        var visible = await resources.VisibleResourcesQuery(outsider.Id, isAdmin: false).ToListAsync();

        Assert.Single(visible);
        Assert.Equal("Public Res", visible[0].Name);
    }

    [Fact]
    public async Task NameTakenInTeamAsync_DetectsDuplicateWithinTeam_ButAllowsAcrossTeams()
    {
        var (db, resources, teams) = CreateServices();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var teamA = await teams.CreateTeamAsync(owner.Id, "Team A", null, TeamVisibility.Public);
        var teamB = await teams.CreateTeamAsync(owner.Id, "Team B", null, TeamVisibility.Public);
        await resources.CreateResourceAsync(teamA.Id, owner.Id, "Res", null, ResourceType.Skill, "key1");

        Assert.True(await resources.NameTakenInTeamAsync(teamA.Id, "Res"));
        Assert.False(await resources.NameTakenInTeamAsync(teamB.Id, "Res"));
    }
}
