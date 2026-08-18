namespace SkillForge.Api.Models.Dtos;

public record ResourceSummaryDto(
    Guid Id,
    Guid TeamId,
    string TeamName,
    string Name,
    string? Description,
    ResourceType Type,
    string PublisherPseudo,
    int UpvoteCount,
    bool UpvotedByMe,
    string? IconPreset,
    string? IconUrl,
    DateTimeOffset CreatedAt
);

public record ResourceDetailDto(
    Guid Id,
    Guid TeamId,
    string TeamName,
    string Name,
    string? Description,
    ResourceType Type,
    string PublisherPseudo,
    int UpvoteCount,
    bool UpvotedByMe,
    string? IconPreset,
    string? IconUrl,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    bool CanManage,
    bool CanDelete
);

public record UpvoteResponse(int UpvoteCount, bool UpvotedByMe);

public record DownloadUrlResponse(string DownloadUrl);

public record ResourcePreviewDto(bool Available, string? FileName, string? Content, bool Truncated);

public record ResourceVersionDto(int VersionNumber, string? Note, DateTimeOffset CreatedAt, string PublisherPseudo, bool IsCurrent);
