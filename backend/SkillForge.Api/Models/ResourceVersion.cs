namespace SkillForge.Api.Models;

public class ResourceVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid ResourceId { get; set; }
    public Resource? Resource { get; set; }
    public required int VersionNumber { get; set; }
    public required string ObjectKey { get; set; }
    public string? Note { get; set; }
    public required Guid CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
