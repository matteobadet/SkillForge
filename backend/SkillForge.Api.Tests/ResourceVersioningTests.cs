using Microsoft.EntityFrameworkCore;
using SkillForge.Api.Data;
using SkillForge.Api.Models;
using SkillForge.Api.Services;
using Xunit;

namespace SkillForge.Api.Tests;

public class ResourceVersioningTests
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
    public async Task CreateInitialVersionAsync_CreatesVersionOne()
    {
        var (db, resources, teams) = CreateServices();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var team = await teams.CreateTeamAsync(owner.Id, "Team", null, TeamVisibility.Public);
        var resource = await resources.CreateResourceAsync(team.Id, owner.Id, "Res", null, ResourceType.Skill, "key-v1");

        await resources.CreateInitialVersionAsync(resource, owner.Id);

        var loaded = await resources.GetVisibleResourceAsync(resource.Id, owner.Id, isAdmin: false);
        var versions = await resources.ListVersionsAsync(loaded!);

        Assert.Single(versions);
        Assert.Equal(1, versions[0].VersionNumber);
        Assert.True(versions[0].IsCurrent);
        Assert.Null(versions[0].Note);
    }

    [Fact]
    public async Task RecordNewVersionAsync_CreatesNextVersion_AndUpdatesObjectKey()
    {
        var (db, resources, teams) = CreateServices();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var team = await teams.CreateTeamAsync(owner.Id, "Team", null, TeamVisibility.Public);
        var resource = await resources.CreateResourceAsync(team.Id, owner.Id, "Res", null, ResourceType.Skill, "key-v1");
        await resources.CreateInitialVersionAsync(resource, owner.Id);

        await resources.RecordNewVersionAsync(resource, "key-v2", "Corrige un bug", owner.Id);

        Assert.Equal("key-v2", resource.ObjectKey);
        var loaded = await resources.GetVisibleResourceAsync(resource.Id, owner.Id, isAdmin: false);
        var versions = await resources.ListVersionsAsync(loaded!);

        Assert.Equal(2, versions.Count);
        Assert.Equal(2, versions[0].VersionNumber);
        Assert.True(versions[0].IsCurrent);
        Assert.Equal("Corrige un bug", versions[0].Note);
        Assert.Equal(1, versions[1].VersionNumber);
        Assert.False(versions[1].IsCurrent);
    }

    [Fact]
    public async Task RecordNewVersionAsync_BackfillsVersionOne_ForLegacyResourceWithNoVersionRows()
    {
        var (db, resources, teams) = CreateServices();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var team = await teams.CreateTeamAsync(owner.Id, "Team", null, TeamVisibility.Public);
        // Simulates a resource published before this feature: no ResourceVersion rows at all.
        var resource = await resources.CreateResourceAsync(team.Id, owner.Id, "Res", null, ResourceType.Skill, "legacy-key");

        await resources.RecordNewVersionAsync(resource, "key-v2", null, owner.Id);

        var loaded = await resources.GetVisibleResourceAsync(resource.Id, owner.Id, isAdmin: false);
        var versions = await resources.ListVersionsAsync(loaded!);

        Assert.Equal(2, versions.Count);
        Assert.Equal(1, versions[1].VersionNumber);
        var objectKeyOfV1 = await resources.GetVersionObjectKeyAsync(loaded!, 1);
        Assert.Equal("legacy-key", objectKeyOfV1);
    }

    [Fact]
    public async Task ListVersionsAsync_SynthesizesSingleVersion_ForLegacyResourceNeverUpdated()
    {
        var (db, resources, teams) = CreateServices();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var team = await teams.CreateTeamAsync(owner.Id, "Team", null, TeamVisibility.Public);
        var resource = await resources.CreateResourceAsync(team.Id, owner.Id, "Res", null, ResourceType.Skill, "legacy-key");
        // No CreateInitialVersionAsync call: simulates a pre-existing resource, zero version rows.

        var loaded = await resources.GetVisibleResourceAsync(resource.Id, owner.Id, isAdmin: false);
        var versions = await resources.ListVersionsAsync(loaded!);

        Assert.Single(versions);
        Assert.Equal(1, versions[0].VersionNumber);
        Assert.True(versions[0].IsCurrent);
        Assert.Equal("owner", versions[0].PublisherPseudo);
    }

    [Fact]
    public async Task GetVersionObjectKeyAsync_ReturnsNull_ForUnknownVersionNumber()
    {
        var (db, resources, teams) = CreateServices();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var team = await teams.CreateTeamAsync(owner.Id, "Team", null, TeamVisibility.Public);
        var resource = await resources.CreateResourceAsync(team.Id, owner.Id, "Res", null, ResourceType.Skill, "legacy-key");

        var objectKey = await resources.GetVersionObjectKeyAsync(resource, 2);

        Assert.Null(objectKey);
    }

    [Fact]
    public async Task DeleteResourceAsync_ReturnsAllVersionObjectKeys()
    {
        var (db, resources, teams) = CreateServices();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var team = await teams.CreateTeamAsync(owner.Id, "Team", null, TeamVisibility.Public);
        var resource = await resources.CreateResourceAsync(team.Id, owner.Id, "Res", null, ResourceType.Skill, "key-v1");
        await resources.CreateInitialVersionAsync(resource, owner.Id);
        await resources.RecordNewVersionAsync(resource, "key-v2", null, owner.Id);
        await resources.RecordNewVersionAsync(resource, "key-v3", null, owner.Id);

        var objectKeys = await resources.DeleteResourceAsync(resource.Id);

        Assert.Equal(3, objectKeys.Count);
        Assert.Contains("key-v1", objectKeys);
        Assert.Contains("key-v2", objectKeys);
        Assert.Contains("key-v3", objectKeys);
        Assert.Empty(await db.ResourceVersions.Where(v => v.ResourceId == resource.Id).ToListAsync());
    }

    [Fact]
    public async Task DeleteResourceAsync_ReturnsCurrentObjectKey_ForLegacyResourceWithNoVersionRows()
    {
        var (db, resources, teams) = CreateServices();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var team = await teams.CreateTeamAsync(owner.Id, "Team", null, TeamVisibility.Public);
        var resource = await resources.CreateResourceAsync(team.Id, owner.Id, "Res", null, ResourceType.Skill, "legacy-key");

        var objectKeys = await resources.DeleteResourceAsync(resource.Id);

        Assert.Single(objectKeys);
        Assert.Equal("legacy-key", objectKeys[0]);
    }

    [Fact]
    public async Task ListVersionsAsync_RespectsPrivateTeamVisibility()
    {
        var (db, resources, teams) = CreateServices();
        var owner = await AddUserAsync(db, "owner@test.com", "owner");
        var outsider = await AddUserAsync(db, "outsider@test.com", "outsider");
        var privateTeam = await teams.CreateTeamAsync(owner.Id, "Private Team", null, TeamVisibility.Prive);
        var resource = await resources.CreateResourceAsync(privateTeam.Id, owner.Id, "Res", null, ResourceType.Skill, "key-v1");
        await resources.CreateInitialVersionAsync(resource, owner.Id);

        var visibleToOutsider = await resources.GetVisibleResourceAsync(resource.Id, outsider.Id, isAdmin: false);

        Assert.Null(visibleToOutsider);
    }
}
