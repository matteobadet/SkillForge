namespace SkillForge.Api.Models;

public enum ResourceType
{
    Skill,
    MCP,
    Agent
}

public class Resource
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid TeamId { get; set; }
    public Team? Team { get; set; }
    public required Guid PublisherUserId { get; set; }
    public User? PublisherUser { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public ResourceType Type { get; set; }
    public required string ObjectKey { get; set; }
    public string? IconPreset { get; set; }
    public string? IconObjectKey { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<ResourceUpvote> Upvotes { get; set; } = new List<ResourceUpvote>();
}
