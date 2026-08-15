using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkillForge.Api.Data;
using SkillForge.Api.Extensions;
using SkillForge.Api.Models;
using SkillForge.Api.Models.Dtos;
using SkillForge.Api.Services;

namespace SkillForge.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public class UsersController(AppDbContext db, AvatarStorageService avatarStorage) : ControllerBase
{
    private static readonly HashSet<string> AllowedContentTypes = new() { "image/jpeg", "image/png", "image/webp" };
    private const long MaxAvatarSizeBytes = 5 * 1024 * 1024;

    private async Task<UserDto> ToDtoAsync(User user)
    {
        string? avatarUrl = null;
        if (!string.IsNullOrEmpty(user.AvatarObjectKey))
        {
            avatarUrl = await avatarStorage.GetAvatarUrlAsync(user.AvatarObjectKey);
        }

        return new UserDto(user.Id, user.Email, user.Pseudo, avatarUrl, user.Role.ToString(), user.CreatedAt);
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var user = await db.Users.FindAsync(User.GetUserId());
        if (user is null) return NotFound();
        return Ok(await ToDtoAsync(user));
    }

    [HttpPatch("me")]
    public async Task<ActionResult<UserDto>> UpdateMe(UpdateProfileRequest request)
    {
        var user = await db.Users.FindAsync(User.GetUserId());
        if (user is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Pseudo) && request.Pseudo != user.Pseudo)
        {
            var pseudoTaken = await db.Users.AnyAsync(u => u.Id != user.Id && u.Pseudo.ToLower() == request.Pseudo.ToLower());
            if (pseudoTaken)
            {
                return Conflict(new { error = "pseudo_taken", message = "Ce pseudo est déjà pris." });
            }
            user.Pseudo = request.Pseudo;
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        return Ok(await ToDtoAsync(user));
    }

    [HttpPost("me/avatar")]
    [RequestSizeLimit(MaxAvatarSizeBytes)]
    public async Task<ActionResult<UserDto>> UploadAvatar(IFormFile file)
    {
        if (file.Length == 0 || file.Length > MaxAvatarSizeBytes || !AllowedContentTypes.Contains(file.ContentType))
        {
            return BadRequest(new { error = "invalid_file", message = "Format ou taille invalide (jpeg/png/webp, 5 Mo max)." });
        }

        var user = await db.Users.FindAsync(User.GetUserId());
        if (user is null) return NotFound();

        string newObjectKey;
        try
        {
            await using var stream = file.OpenReadStream();
            newObjectKey = await avatarStorage.UploadAvatarAsync(user.Id, stream, file.Length, file.ContentType);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { error = "storage_unavailable", message = "Stockage indisponible, aucune modification appliquée." });
        }

        var previousObjectKey = user.AvatarObjectKey;
        user.AvatarObjectKey = newObjectKey;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        if (!string.IsNullOrEmpty(previousObjectKey))
        {
            await avatarStorage.DeleteAvatarAsync(previousObjectKey);
        }

        return Ok(await ToDtoAsync(user));
    }
}
