using Microsoft.EntityFrameworkCore;
using SkillForge.Api.Data;
using SkillForge.Api.Models;

namespace SkillForge.Api.Services;

public class ResourceService(AppDbContext db, TeamService teamService)
{
    public async Task<bool> NameTakenInTeamAsync(Guid teamId, string name, Guid? excludingResourceId = null) =>
        await db.Resources.AnyAsync(r =>
            r.TeamId == teamId &&
            r.Name.ToLower() == name.ToLower() &&
            (excludingResourceId == null || r.Id != excludingResourceId));

    public async Task<Resource> CreateResourceAsync(Guid teamId, Guid publisherUserId, string name, string? description, ResourceType type, string objectKey)
    {
        var resource = new Resource
        {
            TeamId = teamId,
            PublisherUserId = publisherUserId,
            Name = name,
            Description = description,
            Type = type,
            ObjectKey = objectKey,
        };
        db.Resources.Add(resource);
        await db.SaveChangesAsync();
        return resource;
    }

    /// <summary>Resources visible to the caller: their team is Public, or the caller is a member, or the caller is Admin.</summary>
    public IQueryable<Resource> VisibleResourcesQuery(Guid userId, bool isAdmin)
    {
        if (isAdmin) return db.Resources;

        return db.Resources.Where(r =>
            r.Team!.Visibility == TeamVisibility.Public ||
            r.Team!.Members.Any(m => m.UserId == userId));
    }

    public Task<Resource?> GetVisibleResourceAsync(Guid resourceId, Guid userId, bool isAdmin) =>
        VisibleResourcesQuery(userId, isAdmin)
            .Include(r => r.Team)
            .Include(r => r.PublisherUser)
            .Include(r => r.Upvotes)
            .FirstOrDefaultAsync(r => r.Id == resourceId);

    public async Task<bool> CanManageAsync(Resource resource, Guid userId)
    {
        if (resource.PublisherUserId == userId) return true;
        return await teamService.IsOwnerAsync(resource.TeamId, userId);
    }

    public async Task<(int upvoteCount, bool upvotedByMe)> ToggleUpvoteAsync(Guid resourceId, Guid userId)
    {
        var existing = await db.ResourceUpvotes.FirstOrDefaultAsync(u => u.ResourceId == resourceId && u.UserId == userId);
        if (existing is not null)
        {
            db.ResourceUpvotes.Remove(existing);
        }
        else
        {
            db.ResourceUpvotes.Add(new ResourceUpvote { ResourceId = resourceId, UserId = userId });
        }
        await db.SaveChangesAsync();

        var count = await db.ResourceUpvotes.CountAsync(u => u.ResourceId == resourceId);
        return (count, existing is null);
    }

    public Task SaveChangesAsync() => db.SaveChangesAsync();

    public async Task DeleteResourceAsync(Guid resourceId)
    {
        var resource = await db.Resources.FindAsync(resourceId);
        if (resource is not null)
        {
            db.Resources.Remove(resource);
            await db.SaveChangesAsync();
        }
    }
}
