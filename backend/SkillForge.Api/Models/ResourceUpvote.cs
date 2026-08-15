namespace SkillForge.Api.Models;

public class ResourceUpvote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid ResourceId { get; set; }
    public Resource? Resource { get; set; }
    public required Guid UserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
