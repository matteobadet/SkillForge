namespace SkillForge.Api.Models;

public enum UserRole
{
    Utilisateur,
    Admin
}

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string Pseudo { get; set; }
    public string? AvatarObjectKey { get; set; }
    public UserRole Role { get; set; } = UserRole.Utilisateur;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
