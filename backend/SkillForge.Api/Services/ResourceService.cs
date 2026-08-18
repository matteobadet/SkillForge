using Microsoft.EntityFrameworkCore;
using SkillForge.Api.Data;
using SkillForge.Api.Models;
using SkillForge.Api.Models.Dtos;

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

    /// <returns>The previous icon object key, if any (caller deletes it from storage).</returns>
    public async Task<string?> SetIconPresetAsync(Resource resource, string preset)
    {
        var previousObjectKey = resource.IconObjectKey;
        resource.IconPreset = preset;
        resource.IconObjectKey = null;
        await db.SaveChangesAsync();
        return previousObjectKey;
    }

    /// <returns>The previous icon object key, if any (caller deletes it from storage).</returns>
    public async Task<string?> SetIconObjectKeyAsync(Resource resource, string objectKey)
    {
        var previousObjectKey = resource.IconObjectKey;
        resource.IconPreset = null;
        resource.IconObjectKey = objectKey;
        await db.SaveChangesAsync();
        return previousObjectKey;
    }

    /// <returns>Every ObjectKey (all versions) the caller must delete from storage.</returns>
    public async Task<List<string>> DeleteResourceAsync(Guid resourceId)
    {
        var resource = await db.Resources.Include(r => r.Versions).FirstOrDefaultAsync(r => r.Id == resourceId);
        if (resource is null) return [];

        var objectKeys = resource.Versions.Select(v => v.ObjectKey).ToHashSet();
        objectKeys.Add(resource.ObjectKey); // legacy resources have no version rows yet

        db.Resources.Remove(resource); // cascades to ResourceVersion rows
        await db.SaveChangesAsync();
        return objectKeys.ToList();
    }

    public async Task CreateInitialVersionAsync(Resource resource, Guid userId)
    {
        db.ResourceVersions.Add(new ResourceVersion
        {
            ResourceId = resource.Id,
            VersionNumber = 1,
            ObjectKey = resource.ObjectKey,
            CreatedByUserId = userId,
            CreatedAt = resource.CreatedAt,
        });
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Records a new archive as the next version. If this resource predates versioning (no rows
    /// yet), first backfills version 1 from its current state before recording the new one —
    /// the only moment the old archive would otherwise be lost for good.
    /// </summary>
    public async Task RecordNewVersionAsync(Resource resource, string newObjectKey, string? note, Guid userId)
    {
        var existingVersions = await db.ResourceVersions.Where(v => v.ResourceId == resource.Id).ToListAsync();

        if (existingVersions.Count == 0)
        {
            db.ResourceVersions.Add(new ResourceVersion
            {
                ResourceId = resource.Id,
                VersionNumber = 1,
                ObjectKey = resource.ObjectKey,
                CreatedByUserId = resource.PublisherUserId,
                CreatedAt = resource.CreatedAt,
            });
        }

        var nextVersionNumber = (existingVersions.Count == 0 ? 1 : existingVersions.Max(v => v.VersionNumber)) + 1;

        db.ResourceVersions.Add(new ResourceVersion
        {
            ResourceId = resource.Id,
            VersionNumber = nextVersionNumber,
            ObjectKey = newObjectKey,
            Note = string.IsNullOrWhiteSpace(note) ? null : note,
            CreatedByUserId = userId,
            CreatedAt = DateTimeOffset.UtcNow,
        });

        resource.ObjectKey = newObjectKey;
        await db.SaveChangesAsync();
    }

    /// <summary>Returns every version of a resource, most recent first — synthesizes a single
    /// virtual version 1 from the resource's own fields if it predates versioning.</summary>
    public async Task<List<ResourceVersionDto>> ListVersionsAsync(Resource resource)
    {
        var versions = await db.ResourceVersions
            .Include(v => v.CreatedByUser)
            .Where(v => v.ResourceId == resource.Id)
            .OrderByDescending(v => v.VersionNumber)
            .ToListAsync();

        if (versions.Count == 0)
        {
            return [new ResourceVersionDto(1, null, resource.CreatedAt, resource.PublisherUser?.Pseudo ?? "?", true)];
        }

        return versions
            .Select((v, i) => new ResourceVersionDto(v.VersionNumber, v.Note, v.CreatedAt, v.CreatedByUser?.Pseudo ?? "?", i == 0))
            .ToList();
    }

    /// <returns>The ObjectKey for a given version number, or null if it doesn't exist.</returns>
    public async Task<string?> GetVersionObjectKeyAsync(Resource resource, int versionNumber)
    {
        var version = await db.ResourceVersions.FirstOrDefaultAsync(v => v.ResourceId == resource.Id && v.VersionNumber == versionNumber);
        if (version is not null) return version.ObjectKey;

        // Legacy resource with no version rows yet: only version 1 (its current archive) is valid.
        return versionNumber == 1 ? resource.ObjectKey : null;
    }
}
