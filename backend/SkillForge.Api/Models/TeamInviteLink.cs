namespace SkillForge.Api.Models;

public class TeamInviteLink
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid TeamId { get; set; }
    public Team? Team { get; set; }
    public required string Token { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? RevokedAt { get; set; }

    public bool IsActive => RevokedAt is null;
}
