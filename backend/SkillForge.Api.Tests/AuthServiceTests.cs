using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SkillForge.Api.Data;
using SkillForge.Api.Models;
using SkillForge.Api.Options;
using SkillForge.Api.Services;
using Xunit;

namespace SkillForge.Api.Tests;

public class AuthServiceTests
{
    private static AuthService CreateAuthService()
    {
        var dbOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(dbOptions);

        var jwtOptions = Microsoft.Extensions.Options.Options.Create(new JwtOptions
        {
            SigningKey = "unit-test-signing-key-at-least-32-bytes-long",
            Issuer = "skillforge-tests",
        });

        return new AuthService(db, jwtOptions);
    }

    [Fact]
    public void HashPassword_ThenVerifyPassword_WithCorrectPassword_Succeeds()
    {
        var auth = CreateAuthService();
        var user = new User { Email = "a@b.com", Pseudo = "a", PasswordHash = string.Empty };

        user.PasswordHash = auth.HashPassword(user, "motdepasse123");

        Assert.True(auth.VerifyPassword(user, "motdepasse123"));
    }

    [Fact]
    public void VerifyPassword_WithWrongPassword_Fails()
    {
        var auth = CreateAuthService();
        var user = new User { Email = "a@b.com", Pseudo = "a", PasswordHash = string.Empty };
        user.PasswordHash = auth.HashPassword(user, "motdepasse123");

        Assert.False(auth.VerifyPassword(user, "wrong-password"));
    }

    [Fact]
    public void GenerateAccessToken_ContainsSubEmailAndRoleClaims()
    {
        var auth = CreateAuthService();
        var user = new User { Email = "a@b.com", Pseudo = "a", PasswordHash = "x", Role = UserRole.Admin };

        var token = auth.GenerateAccessToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        Assert.Equal(user.Id.ToString(), jwt.Claims.Single(c => c.Type == JwtRegisteredClaimNames.Sub).Value);
        Assert.Contains(jwt.Claims, c => c.Value == "a@b.com");
        Assert.Contains(jwt.Claims, c => c.Value == "Admin");
    }

    [Fact]
    public async Task IssueRefreshTokenAsync_ThenRotate_ReturnsNewTokensAndRevokesOld()
    {
        var dbOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        // Re-create with a shared db so the service and assertions see the same data.
        var db = new AppDbContext(dbOptions);
        var jwtOptions = Microsoft.Extensions.Options.Options.Create(new JwtOptions { SigningKey = "unit-test-signing-key-at-least-32-bytes-long", Issuer = "skillforge-tests" });
        var service = new AuthService(db, jwtOptions);

        var user = new User { Email = "a@b.com", Pseudo = "a", PasswordHash = "x" };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var firstToken = await service.IssueRefreshTokenAsync(user.Id);
        var result = await service.RotateRefreshTokenAsync(firstToken);

        Assert.True(result.Success);
        Assert.NotEqual(firstToken, result.RefreshToken);

        var reuseResult = await service.RotateRefreshTokenAsync(firstToken);
        Assert.False(reuseResult.Success);
        Assert.Equal("token_reuse_detected", reuseResult.Error);
    }
}
