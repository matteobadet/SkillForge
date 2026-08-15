namespace SkillForge.Api.Models;

public enum TeamRole
{
    Member,
    Owner
}

public class TeamMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid TeamId { get; set; }
    public Team? Team { get; set; }
    public required Guid UserId { get; set; }
    public User? User { get; set; }
    public TeamRole Role { get; set; } = TeamRole.Member;
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;
}
