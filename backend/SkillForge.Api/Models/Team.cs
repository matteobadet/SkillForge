namespace SkillForge.Api.Models;

public enum TeamVisibility
{
    Public,
    Prive
}

public class Team
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public string? Description { get; set; }
    public TeamVisibility Visibility { get; set; } = TeamVisibility.Prive;
    public string? IconPreset { get; set; }
    public string? IconObjectKey { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<TeamMember> Members { get; set; } = new List<TeamMember>();
    public ICollection<TeamInviteLink> InviteLinks { get; set; } = new List<TeamInviteLink>();
}
