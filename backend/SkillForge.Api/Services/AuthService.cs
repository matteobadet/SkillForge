using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SkillForge.Api.Data;
using SkillForge.Api.Models;
using SkillForge.Api.Options;

namespace SkillForge.Api.Services;

public record RefreshResult(bool Success, string? AccessToken, string? RefreshToken, string? Error);

public class AuthService(AppDbContext db, IOptions<JwtOptions> jwtOptions)
{
    private readonly PasswordHasher<User> _passwordHasher = new();
    private readonly JwtOptions _jwt = jwtOptions.Value;

    public string HashPassword(User user, string password) => _passwordHasher.HashPassword(user, password);

    public bool VerifyPassword(User user, string password) =>
        _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password) != PasswordVerificationResult.Failed;

    public string GenerateAccessToken(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.SigningKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Issuer,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwt.AccessTokenMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }

    private static string GenerateOpaqueToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }

    public async Task<string> IssueRefreshTokenAsync(Guid userId)
    {
        var plainToken = GenerateOpaqueToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = userId,
            TokenHash = HashToken(plainToken),
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_jwt.RefreshTokenDays),
        });

        await db.SaveChangesAsync();
        return plainToken;
    }

    public async Task<RefreshResult> RotateRefreshTokenAsync(string plainToken)
    {
        var hash = HashToken(plainToken);
        var existing = await db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash);

        if (existing is null)
        {
            return new RefreshResult(false, null, null, "invalid_token");
        }

        if (existing.RevokedAt is not null)
        {
            // Reuse of a revoked token: possible theft, revoke all active tokens for this user.
            var activeTokens = await db.RefreshTokens
                .Where(t => t.UserId == existing.UserId && t.RevokedAt == null)
                .ToListAsync();
            foreach (var t in activeTokens)
            {
                t.RevokedAt = DateTimeOffset.UtcNow;
            }
            await db.SaveChangesAsync();
            return new RefreshResult(false, null, null, "token_reuse_detected");
        }

        if (existing.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return new RefreshResult(false, null, null, "expired_token");
        }

        existing.RevokedAt = DateTimeOffset.UtcNow;
        var newAccessToken = GenerateAccessToken(existing.User!);
        var newRefreshToken = await IssueRefreshTokenAsync(existing.UserId);
        await db.SaveChangesAsync();

        return new RefreshResult(true, newAccessToken, newRefreshToken, null);
    }

    public async Task RevokeRefreshTokenAsync(string plainToken)
    {
        var hash = HashToken(plainToken);
        var existing = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (existing is not null && existing.RevokedAt is null)
        {
            existing.RevokedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }
    }
}
