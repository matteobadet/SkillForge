using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SkillForge.Api.Data;
using SkillForge.Api.Extensions;
using SkillForge.Api.Models;
using SkillForge.Api.Models.Dtos;
using SkillForge.Api.Options;
using SkillForge.Api.Services;

namespace SkillForge.Api.Controllers;

[ApiController]
[Authorize]
public class ResourcesController(
    AppDbContext db,
    ResourceService resourceService,
    TeamService teamService,
    ObjectStorageService objectStorage,
    IOptions<MinioOptions> minioOptions) : ControllerBase
{
    private static readonly HashSet<string> AllowedContentTypes = new() { "application/zip", "application/x-zip-compressed", "application/x-zip" };
    private static readonly HashSet<string> AllowedIconContentTypes = new() { "image/jpeg", "image/png", "image/webp" };
    private const long MaxArchiveSizeBytes = 50 * 1024 * 1024;
    private const long MaxIconSizeBytes = 2 * 1024 * 1024;
    private string ResourcesBucket => minioOptions.Value.ResourcesBucket;
    private string IconsBucket => minioOptions.Value.IconsBucket;
    private bool IsAdmin => User.IsInRole(UserRole.Admin.ToString());

    private static bool IsZip(IFormFile file) =>
        AllowedContentTypes.Contains(file.ContentType) || file.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase);

    private static bool IsImage(IFormFile file) =>
        AllowedIconContentTypes.Contains(file.ContentType);

    private async Task<ResourceSummaryDto> ToSummaryDtoAsync(Resource r, Guid callerId)
    {
        var team = r.Team ?? await db.Teams.FindAsync(r.TeamId);
        var publisher = r.PublisherUser ?? await db.Users.FindAsync(r.PublisherUserId);
        var upvoteCount = r.Upvotes?.Count ?? await db.ResourceUpvotes.CountAsync(u => u.ResourceId == r.Id);
        var upvotedByMe = r.Upvotes?.Any(u => u.UserId == callerId)
            ?? await db.ResourceUpvotes.AnyAsync(u => u.ResourceId == r.Id && u.UserId == callerId);
        var iconUrl = string.IsNullOrEmpty(r.IconObjectKey) ? null : await objectStorage.GetPresignedUrlAsync(IconsBucket, r.IconObjectKey);

        return new ResourceSummaryDto(r.Id, r.TeamId, team?.Name ?? "?", r.Name, r.Description, r.Type,
            publisher?.Pseudo ?? "?", upvoteCount, upvotedByMe, r.IconPreset, iconUrl, r.CreatedAt);
    }

    private async Task<ResourceDetailDto> ToDetailDtoAsync(Resource r, Guid callerId)
    {
        var summary = await ToSummaryDtoAsync(r, callerId);
        var canManage = await resourceService.CanManageAsync(r, callerId);
        var canDelete = canManage || IsAdmin;
        return new ResourceDetailDto(summary.Id, summary.TeamId, summary.TeamName, summary.Name, summary.Description,
            summary.Type, summary.PublisherPseudo, summary.UpvoteCount, summary.UpvotedByMe, summary.IconPreset, summary.IconUrl,
            summary.CreatedAt, r.UpdatedAt, canManage, canDelete);
    }

    [HttpPost("api/teams/{teamId:guid}/resources")]
    public async Task<ActionResult<ResourceDetailDto>> Publish(Guid teamId, [FromForm] string name, [FromForm] string? description, [FromForm] ResourceType type, [FromForm] string? iconPreset, IFormFile file)
    {
        var userId = User.GetUserId();
        if (await teamService.GetMemberRoleAsync(teamId, userId) is null) return Forbid();

        if (string.IsNullOrWhiteSpace(name)) return BadRequest(new { error = "invalid_name", message = "Le nom est requis." });
        if (file is null || file.Length == 0 || file.Length > MaxArchiveSizeBytes || !IsZip(file))
        {
            return BadRequest(new { error = "invalid_file", message = "Archive .zip requise (50 Mo max)." });
        }
        if (iconPreset is not null && !IconPresets.Known.Contains(iconPreset))
        {
            return BadRequest(new { error = "invalid_icon_preset", message = "Icône de palette inconnue." });
        }
        if (await resourceService.NameTakenInTeamAsync(teamId, name))
        {
            return Conflict(new { error = "name_taken", message = "Ce nom est déjà utilisé dans cette équipe." });
        }

        string objectKey;
        try
        {
            await using var stream = file.OpenReadStream();
            objectKey = $"{teamId}/{Guid.NewGuid()}.zip";
            await objectStorage.UploadAsync(ResourcesBucket, objectKey, stream, file.Length, file.ContentType);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { error = "storage_unavailable", message = "Stockage indisponible, aucune ressource créée." });
        }

        var resource = await resourceService.CreateResourceAsync(teamId, userId, name, description, type, objectKey);
        if (iconPreset is not null)
        {
            await resourceService.SetIconPresetAsync(resource, iconPreset);
        }
        var full = await resourceService.GetVisibleResourceAsync(resource.Id, userId, IsAdmin);
        return Created(string.Empty, await ToDetailDtoAsync(full!, userId));
    }

    [HttpGet("api/teams/{teamId:guid}/resources")]
    public async Task<ActionResult<List<ResourceSummaryDto>>> ListForTeam(Guid teamId)
    {
        var userId = User.GetUserId();
        var team = await teamService.GetVisibleTeamAsync(teamId, userId, IsAdmin);
        if (team is null) return NotFound();

        var resources = await resourceService.VisibleResourcesQuery(userId, IsAdmin)
            .Where(r => r.TeamId == teamId)
            .Include(r => r.Team).Include(r => r.PublisherUser).Include(r => r.Upvotes)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var dtos = new List<ResourceSummaryDto>();
        foreach (var r in resources) dtos.Add(await ToSummaryDtoAsync(r, userId));
        return Ok(dtos);
    }

    [HttpGet("api/resources")]
    public async Task<ActionResult<List<ResourceSummaryDto>>> ListStore()
    {
        var userId = User.GetUserId();
        var resources = await resourceService.VisibleResourcesQuery(userId, IsAdmin)
            .Include(r => r.Team).Include(r => r.PublisherUser).Include(r => r.Upvotes)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var dtos = new List<ResourceSummaryDto>();
        foreach (var r in resources) dtos.Add(await ToSummaryDtoAsync(r, userId));
        return Ok(dtos);
    }

    [HttpGet("api/resources/{id:guid}")]
    public async Task<ActionResult<ResourceDetailDto>> GetById(Guid id)
    {
        var userId = User.GetUserId();
        var resource = await resourceService.GetVisibleResourceAsync(id, userId, IsAdmin);
        if (resource is null) return NotFound();
        return Ok(await ToDetailDtoAsync(resource, userId));
    }

    [HttpGet("api/resources/{id:guid}/download")]
    public async Task<ActionResult<DownloadUrlResponse>> Download(Guid id)
    {
        var userId = User.GetUserId();
        var resource = await resourceService.GetVisibleResourceAsync(id, userId, IsAdmin);
        if (resource is null) return NotFound();

        var url = await objectStorage.GetPresignedUrlAsync(ResourcesBucket, resource.ObjectKey);
        return Ok(new DownloadUrlResponse(url));
    }

    [HttpPatch("api/resources/{id:guid}")]
    public async Task<ActionResult<ResourceDetailDto>> Update(Guid id, [FromForm] string? name, [FromForm] string? description, [FromForm] string? iconPreset, IFormFile? file)
    {
        var userId = User.GetUserId();
        var resource = await resourceService.GetVisibleResourceAsync(id, userId, IsAdmin);
        if (resource is null) return NotFound();
        if (!await resourceService.CanManageAsync(resource, userId)) return Forbid();

        if (!string.IsNullOrWhiteSpace(name) && name != resource.Name)
        {
            if (await resourceService.NameTakenInTeamAsync(resource.TeamId, name, resource.Id))
            {
                return Conflict(new { error = "name_taken", message = "Ce nom est déjà utilisé dans cette équipe." });
            }
            resource.Name = name;
        }
        if (description is not null) resource.Description = description;

        if (iconPreset is not null)
        {
            if (!IconPresets.Known.Contains(iconPreset))
            {
                return BadRequest(new { error = "invalid_icon_preset", message = "Icône de palette inconnue." });
            }
            var previousIconKey = await resourceService.SetIconPresetAsync(resource, iconPreset);
            if (!string.IsNullOrEmpty(previousIconKey))
            {
                await objectStorage.DeleteAsync(IconsBucket, previousIconKey);
            }
        }

        if (file is not null && file.Length > 0)
        {
            if (file.Length > MaxArchiveSizeBytes || !IsZip(file))
            {
                return BadRequest(new { error = "invalid_file", message = "Archive .zip requise (50 Mo max)." });
            }
            var previousKey = resource.ObjectKey;
            await using var stream = file.OpenReadStream();
            var newKey = $"{resource.TeamId}/{Guid.NewGuid()}.zip";
            await objectStorage.UploadAsync(ResourcesBucket, newKey, stream, file.Length, file.ContentType);
            resource.ObjectKey = newKey;
            await objectStorage.DeleteAsync(ResourcesBucket, previousKey);
        }

        resource.UpdatedAt = DateTimeOffset.UtcNow;
        await resourceService.SaveChangesAsync();
        return Ok(await ToDetailDtoAsync(resource, userId));
    }

    [HttpPost("api/resources/{id:guid}/icon")]
    public async Task<ActionResult<ResourceDetailDto>> UploadIcon(Guid id, IFormFile file)
    {
        var userId = User.GetUserId();
        var resource = await resourceService.GetVisibleResourceAsync(id, userId, IsAdmin);
        if (resource is null) return NotFound();
        if (!await resourceService.CanManageAsync(resource, userId)) return Forbid();

        if (file is null || file.Length == 0 || file.Length > MaxIconSizeBytes || !IsImage(file))
        {
            return BadRequest(new { error = "invalid_file", message = "Image requise (jpeg/png/webp, 2 Mo max)." });
        }

        string newObjectKey;
        try
        {
            await using var stream = file.OpenReadStream();
            newObjectKey = $"resources/{id}/{Guid.NewGuid()}";
            await objectStorage.UploadAsync(IconsBucket, newObjectKey, stream, file.Length, file.ContentType);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { error = "storage_unavailable", message = "Stockage indisponible, aucune modification appliquée." });
        }

        var previousKey = await resourceService.SetIconObjectKeyAsync(resource, newObjectKey);
        if (!string.IsNullOrEmpty(previousKey))
        {
            await objectStorage.DeleteAsync(IconsBucket, previousKey);
        }

        return Ok(await ToDetailDtoAsync(resource, userId));
    }

    [HttpDelete("api/resources/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        var resource = await resourceService.GetVisibleResourceAsync(id, userId, IsAdmin);
        if (resource is null) return NotFound();
        if (!await resourceService.CanManageAsync(resource, userId) && !IsAdmin) return Forbid();

        await resourceService.DeleteResourceAsync(id);
        await objectStorage.DeleteAsync(ResourcesBucket, resource.ObjectKey);
        return NoContent();
    }

    [HttpPost("api/resources/{id:guid}/upvote")]
    public async Task<ActionResult<UpvoteResponse>> ToggleUpvote(Guid id)
    {
        var userId = User.GetUserId();
        var resource = await resourceService.GetVisibleResourceAsync(id, userId, IsAdmin);
        if (resource is null) return NotFound();

        var (count, upvotedByMe) = await resourceService.ToggleUpvoteAsync(id, userId);
        return Ok(new UpvoteResponse(count, upvotedByMe));
    }
}
