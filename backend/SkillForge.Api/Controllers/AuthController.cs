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
[Route("api/auth")]
public class AuthController(AppDbContext db, AuthService authService) : ControllerBase
{
    private static UserDto ToDto(User user) =>
        new(user.Id, user.Email, user.Pseudo, null, user.Role.ToString(), user.CreatedAt);

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var emailTaken = await db.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (emailTaken)
        {
            return Conflict(new { error = "email_taken", message = "Cet email est déjà utilisé." });
        }

        var pseudoTaken = await db.Users.AnyAsync(u => u.Pseudo.ToLower() == request.Pseudo.ToLower());
        if (pseudoTaken)
        {
            return Conflict(new { error = "pseudo_taken", message = "Ce pseudo est déjà pris." });
        }

        var user = new User
        {
            Email = request.Email,
            Pseudo = request.Pseudo,
            PasswordHash = string.Empty,
        };
        user.PasswordHash = authService.HashPassword(user, request.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var accessToken = authService.GenerateAccessToken(user);
        var refreshToken = await authService.IssueRefreshTokenAsync(user.Id);

        return Created(string.Empty, new AuthResponse(accessToken, refreshToken, ToDto(user)));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (user is null || !authService.VerifyPassword(user, request.Password))
        {
            return Unauthorized(new { error = "invalid_credentials", message = "Email ou mot de passe incorrect." });
        }

        var accessToken = authService.GenerateAccessToken(user);
        var refreshToken = await authService.IssueRefreshTokenAsync(user.Id);

        return Ok(new AuthResponse(accessToken, refreshToken, ToDto(user)));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<RefreshResponse>> Refresh(RefreshRequest request)
    {
        var result = await authService.RotateRefreshTokenAsync(request.RefreshToken);
        if (!result.Success)
        {
            return Unauthorized(new { error = result.Error, message = "Refresh token invalide, expiré ou révoqué." });
        }

        return Ok(new RefreshResponse(result.AccessToken!, result.RefreshToken!));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequest request)
    {
        await authService.RevokeRefreshTokenAsync(request.RefreshToken);
        return NoContent();
    }
}
