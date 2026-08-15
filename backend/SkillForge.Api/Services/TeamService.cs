using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using SkillForge.Api.Data;
using SkillForge.Api.Models;

namespace SkillForge.Api.Services;

public class TeamService(AppDbContext db)
{
    private static string GenerateOpaqueToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }

    public async Task<Team> CreateTeamAsync(Guid userId, string name, string? description, TeamVisibility visibility)
    {
        var team = new Team { Name = name, Description = description, Visibility = visibility };
        team.Members.Add(new TeamMember { TeamId = team.Id, UserId = userId, Role = TeamRole.Owner });
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        return team;
    }

    public Task SaveChangesAsync() => db.SaveChangesAsync();

    /// <returns>The previous icon object key, if any (caller deletes it from storage).</returns>
    public async Task<string?> SetIconPresetAsync(Team team, string preset)
    {
        var previousObjectKey = team.IconObjectKey;
        team.IconPreset = preset;
        team.IconObjectKey = null;
        await db.SaveChangesAsync();
        return previousObjectKey;
    }

    /// <returns>The previous icon object key, if any (caller deletes it from storage).</returns>
    public async Task<string?> SetIconObjectKeyAsync(Team team, string objectKey)
    {
        var previousObjectKey = team.IconObjectKey;
        team.IconPreset = null;
        team.IconObjectKey = objectKey;
        await db.SaveChangesAsync();
        return previousObjectKey;
    }

    public async Task DeleteTeamAsync(Guid teamId)
    {
        var team = await db.Teams.FindAsync(teamId);
        if (team is not null)
        {
            db.Teams.Remove(team);
            await db.SaveChangesAsync();
        }
    }

    public Task<TeamRole?> GetMemberRoleAsync(Guid teamId, Guid userId) =>
        db.TeamMembers
            .Where(m => m.TeamId == teamId && m.UserId == userId)
            .Select(m => (TeamRole?)m.Role)
            .FirstOrDefaultAsync();

    public async Task<bool> IsOwnerAsync(Guid teamId, Guid userId) =>
        await GetMemberRoleAsync(teamId, userId) == TeamRole.Owner;

    /// <summary>Teams visible to the caller: Public, or private teams they belong to, or all if Admin.</summary>
    public IQueryable<Team> VisibleTeamsQuery(Guid userId, bool isAdmin)
    {
        if (isAdmin) return db.Teams;

        return db.Teams.Where(t =>
            t.Visibility == TeamVisibility.Public ||
            t.Members.Any(m => m.UserId == userId));
    }

    /// <summary>Team directory: all teams for an Admin (cf. FR-008), public-only otherwise.</summary>
    public async Task<List<Team>> ListDirectoryTeamsAsync(bool isAdmin)
    {
        var query = isAdmin ? db.Teams : db.Teams.Where(t => t.Visibility == TeamVisibility.Public);
        return await query.Include(t => t.Members).ToListAsync();
    }

    public async Task<List<Team>> ListMyTeamsAsync(Guid userId) =>
        await db.Teams.Where(t => t.Members.Any(m => m.UserId == userId)).Include(t => t.Members).ToListAsync();

    public async Task<Team?> GetVisibleTeamAsync(Guid teamId, Guid userId, bool isAdmin) =>
        await VisibleTeamsQuery(userId, isAdmin)
            .Include(t => t.Members).ThenInclude(m => m.User)
            .FirstOrDefaultAsync(t => t.Id == teamId);

    public async Task RemoveMemberAsync(Guid teamId, Guid targetUserId)
    {
        var member = await db.TeamMembers.FirstOrDefaultAsync(m => m.TeamId == teamId && m.UserId == targetUserId);
        if (member is not null)
        {
            db.TeamMembers.Remove(member);
            await db.SaveChangesAsync();
        }
    }

    public async Task<string> RegenerateInviteLinkAsync(Guid teamId)
    {
        var activeLinks = await db.TeamInviteLinks.Where(l => l.TeamId == teamId && l.RevokedAt == null).ToListAsync();
        foreach (var link in activeLinks)
        {
            link.RevokedAt = DateTimeOffset.UtcNow;
        }

        var token = GenerateOpaqueToken();
        db.TeamInviteLinks.Add(new TeamInviteLink { TeamId = teamId, Token = token });
        await db.SaveChangesAsync();
        return token;
    }

    public Task<string?> GetActiveInviteTokenAsync(Guid teamId) =>
        db.TeamInviteLinks
            .Where(l => l.TeamId == teamId && l.RevokedAt == null)
            .Select(l => l.Token)
            .FirstOrDefaultAsync();

    /// <returns>The team joined, or null if the token is invalid/revoked.</returns>
    public async Task<Team?> JoinByTokenAsync(string token, Guid userId)
    {
        var link = await db.TeamInviteLinks.FirstOrDefaultAsync(l => l.Token == token && l.RevokedAt == null);
        if (link is null) return null;

        var alreadyMember = await db.TeamMembers.AnyAsync(m => m.TeamId == link.TeamId && m.UserId == userId);
        if (!alreadyMember)
        {
            db.TeamMembers.Add(new TeamMember { TeamId = link.TeamId, UserId = userId, Role = TeamRole.Member });
            await db.SaveChangesAsync();
        }

        return await db.Teams.FirstOrDefaultAsync(t => t.Id == link.TeamId);
    }
}
