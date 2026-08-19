using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SkillForge.Api.Models;
using SkillForge.Api.Models.Dtos;
using SkillForge.Api.Options;
using SkillForge.Api.Services;

namespace SkillForge.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin")]
public class AdminController(ObjectStorageService objectStorage, IOptions<MinioOptions> minioOptions) : ControllerBase
{
    private bool IsAdmin => User.IsInRole(UserRole.Admin.ToString());

    [HttpGet("storage")]
    public async Task<ActionResult<StorageUsageDto>> GetStorageUsage()
    {
        if (!IsAdmin) return Forbid();

        var buckets = new[]
        {
            (minioOptions.Value.ResourcesBucket, "Archives de ressources"),
            (minioOptions.Value.IconsBucket, "Icônes"),
            (minioOptions.Value.AvatarsBucket, "Avatars"),
        };

        try
        {
            return Ok(await objectStorage.GetUsageAsync(buckets));
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { error = "storage_unavailable", message = "Impossible de mesurer l'espace de stockage pour le moment." });
        }
    }
}
