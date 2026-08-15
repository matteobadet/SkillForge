using System.ComponentModel.DataAnnotations;

namespace SkillForge.Api.Models.Dtos;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required, MinLength(3), MaxLength(32)] string Pseudo
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record RefreshRequest([Required] string RefreshToken);

public record UserDto(Guid Id, string Email, string Pseudo, string? AvatarUrl, string Role, DateTimeOffset CreatedAt);

public record AuthResponse(string AccessToken, string RefreshToken, UserDto User);

public record RefreshResponse(string AccessToken, string RefreshToken);

public record UpdateProfileRequest(
    [MinLength(3), MaxLength(32)] string? Pseudo
);
