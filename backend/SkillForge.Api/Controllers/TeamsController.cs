using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SkillForge.Api.Extensions;
using SkillForge.Api.Models;
using SkillForge.Api.Models.Dtos;
using SkillForge.Api.Options;
using SkillForge.Api.Services;

namespace SkillForge.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/teams")]
public class TeamsController(TeamService teamService, ObjectStorageService objectStorage, IOptions<MinioOptions> minioOptions) : ControllerBase
{
    private static readonly HashSet<string> AllowedIconContentTypes = new() { "image/jpeg", "image/png", "image/webp" };
    private const long MaxIconSizeBytes = 2 * 1024 * 1024;
    private string IconsBucket => minioOptions.Value.IconsBucket;
    private bool IsAdmin => User.IsInRole(UserRole.Admin.ToString());

    private static bool IsImage(IFormFile file) =>
        AllowedIconContentTypes.Contains(file.ContentType);

    private async Task<string?> ResolveIconUrlAsync(Team team) =>
        string.IsNullOrEmpty(team.IconObjectKey) ? null : await objectStorage.GetPresignedUrlAsync(IconsBucket, team.IconObjectKey);

    private async Task<TeamSummaryDto> ToSummaryDtoAsync(Team team, Guid callerId) => new(
        team.Id,
        team.Name,
        team.Description,
        team.Visibility,
        team.Members.Count,
        team.Members.FirstOrDefault(m => m.UserId == callerId)?.Role,
        team.IconPreset,
        await ResolveIconUrlAsync(team)
    );

    private async Task<TeamDetailDto> ToDetailDtoAsync(Team team, Guid callerId)
    {
        var members = new List<TeamMemberDto>();
        foreach (var m in team.Members)
        {
            string? avatarUrl = null;
            if (!string.IsNullOrEmpty(m.User?.AvatarObjectKey))
            {
                avatarUrl = await objectStorage.GetPresignedUrlAsync(minioOptions.Value.AvatarsBucket, m.User.AvatarObjectKey);
            }
            members.Add(new TeamMemberDto(m.UserId, m.User?.Pseudo ?? "?", avatarUrl, m.Role));
        }

        return new TeamDetailDto(
            team.Id,
            team.Name,
            team.Description,
            team.Visibility,
            team.Members.Count,
            team.Members.FirstOrDefault(m => m.UserId == callerId)?.Role,
            team.IconPreset,
            await ResolveIconUrlAsync(team),
            team.CreatedAt,
            members
        );
    }

    [HttpPost]
    public async Task<ActionResult<TeamDetailDto>> Create(CreateTeamRequest request)
    {
        if (request.IconPreset is not null && !IconPresets.Known.Contains(request.IconPreset))
        {
            return BadRequest(new { error = "invalid_icon_preset", message = "Icône de palette inconnue." });
        }

        var userId = User.GetUserId();
        var created = await teamService.CreateTeamAsync(userId, request.Name, request.Description, request.Visibility);
        if (request.IconPreset is not null)
        {
            await teamService.SetIconPresetAsync(created, request.IconPreset);
        }
        var team = await teamService.GetVisibleTeamAsync(created.Id, userId, IsAdmin);
        return Created(string.Empty, await ToDetailDtoAsync(team!, userId));
    }

    [HttpGet]
    public async Task<ActionResult<List<TeamSummaryDto>>> ListPublic()
    {
        var userId = User.GetUserId();
        var teams = await teamService.ListDirectoryTeamsAsync(IsAdmin);
        var dtos = new List<TeamSummaryDto>();
        foreach (var t in teams) dtos.Add(await ToSummaryDtoAsync(t, userId));
        return Ok(dtos);
    }

    [HttpGet("mine")]
    public async Task<ActionResult<List<TeamSummaryDto>>> ListMine()
    {
        var userId = User.GetUserId();
        var teams = await teamService.ListMyTeamsAsync(userId);
        var dtos = new List<TeamSummaryDto>();
        foreach (var t in teams) dtos.Add(await ToSummaryDtoAsync(t, userId));
        return Ok(dtos);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TeamDetailDto>> GetById(Guid id)
    {
        var userId = User.GetUserId();
        var team = await teamService.GetVisibleTeamAsync(id, userId, IsAdmin);
        if (team is null) return NotFound();
        return Ok(await ToDetailDtoAsync(team, userId));
    }

    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<TeamDetailDto>> Update(Guid id, UpdateTeamRequest request)
    {
        var userId = User.GetUserId();
        if (!await teamService.IsOwnerAsync(id, userId)) return Forbid();

        var team = await teamService.GetVisibleTeamAsync(id, userId, IsAdmin);
        if (team is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Name)) team.Name = request.Name;
        if (request.Description is not null) team.Description = request.Description;
        if (request.Visibility is not null) team.Visibility = request.Visibility.Value;

        if (request.IconPreset is not null)
        {
            if (!IconPresets.Known.Contains(request.IconPreset))
            {
                return BadRequest(new { error = "invalid_icon_preset", message = "Icône de palette inconnue." });
            }
            var previousKey = await teamService.SetIconPresetAsync(team, request.IconPreset);
            if (!string.IsNullOrEmpty(previousKey))
            {
                await objectStorage.DeleteAsync(IconsBucket, previousKey);
            }
        }

        await teamService.SaveChangesAsync();
        return Ok(await ToDetailDtoAsync(team, userId));
    }

    [HttpPost("{id:guid}/icon")]
    public async Task<ActionResult<TeamDetailDto>> UploadIcon(Guid id, IFormFile file)
    {
        var userId = User.GetUserId();
        if (!await teamService.IsOwnerAsync(id, userId)) return Forbid();

        var team = await teamService.GetVisibleTeamAsync(id, userId, IsAdmin);
        if (team is null) return NotFound();

        if (file is null || file.Length == 0 || file.Length > MaxIconSizeBytes || !IsImage(file))
        {
            return BadRequest(new { error = "invalid_file", message = "Image requise (jpeg/png/webp, 2 Mo max)." });
        }

        string newObjectKey;
        try
        {
            await using var stream = file.OpenReadStream();
            newObjectKey = $"teams/{id}/{Guid.NewGuid()}";
            await objectStorage.UploadAsync(IconsBucket, newObjectKey, stream, file.Length, file.ContentType);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { error = "storage_unavailable", message = "Stockage indisponible, aucune modification appliquée." });
        }

        var previousKey = await teamService.SetIconObjectKeyAsync(team, newObjectKey);
        if (!string.IsNullOrEmpty(previousKey))
        {
            await objectStorage.DeleteAsync(IconsBucket, previousKey);
        }

        return Ok(await ToDetailDtoAsync(team, userId));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        if (!await teamService.IsOwnerAsync(id, userId)) return Forbid();

        var team = await teamService.GetVisibleTeamAsync(id, userId, IsAdmin);
        if (team is null) return NotFound();

        await teamService.DeleteTeamAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/leave")]
    public async Task<IActionResult> Leave(Guid id)
    {
        var userId = User.GetUserId();
        var role = await teamService.GetMemberRoleAsync(id, userId);
        if (role is null) return NoContent();
        if (role == TeamRole.Owner) return Conflict(new { error = "owner_cannot_leave", message = "L'owner doit supprimer l'équipe plutôt que la quitter." });

        await teamService.RemoveMemberAsync(id, userId);
        return NoContent();
    }

    [HttpDelete("{id:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId)
    {
        var callerId = User.GetUserId();
        if (!await teamService.IsOwnerAsync(id, callerId)) return Forbid();
        if (userId == callerId) return BadRequest(new { error = "cannot_remove_owner", message = "L'owner ne peut pas se retirer lui-même." });

        await teamService.RemoveMemberAsync(id, userId);
        return NoContent();
    }

    [HttpGet("{id:guid}/invite-link")]
    public async Task<ActionResult<InviteLinkResponse>> GetInviteLink(Guid id)
    {
        var userId = User.GetUserId();
        if (!await teamService.IsOwnerAsync(id, userId)) return Forbid();

        var token = await teamService.GetActiveInviteTokenAsync(id);
        return Ok(new InviteLinkResponse(token is null ? null : BuildInviteUrl(token)));
    }

    [HttpPost("{id:guid}/invite-link/regenerate")]
    public async Task<ActionResult<InviteLinkResponse>> RegenerateInviteLink(Guid id)
    {
        var userId = User.GetUserId();
        if (!await teamService.IsOwnerAsync(id, userId)) return Forbid();

        var token = await teamService.RegenerateInviteLinkAsync(id);
        return Ok(new InviteLinkResponse(BuildInviteUrl(token)));
    }

    [HttpPost("join/{token}")]
    public async Task<ActionResult<TeamDetailDto>> Join(string token)
    {
        var userId = User.GetUserId();
        var team = await teamService.JoinByTokenAsync(token, userId);
        if (team is null) return NotFound(new { error = "invalid_invite", message = "Lien d'invitation invalide ou révoqué." });

        var full = await teamService.GetVisibleTeamAsync(team.Id, userId, IsAdmin);
        return Ok(await ToDetailDtoAsync(full!, userId));
    }

    private string BuildInviteUrl(string token)
    {
        var frontendOrigin = HttpContext.RequestServices
            .GetRequiredService<IConfiguration>()["FRONTEND_ORIGIN"] ?? "http://localhost:5173";
        return $"{frontendOrigin}/invite/{token}";
    }
}
