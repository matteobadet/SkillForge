using System.ComponentModel.DataAnnotations;

namespace SkillForge.Api.Models.Dtos;

public record CreateTeamRequest(
    [Required, MinLength(1), MaxLength(64)] string Name,
    [MaxLength(500)] string? Description,
    [Required] TeamVisibility Visibility
);

public record UpdateTeamRequest(
    [MinLength(1), MaxLength(64)] string? Name,
    [MaxLength(500)] string? Description,
    TeamVisibility? Visibility
);

public record TeamMemberDto(Guid UserId, string Pseudo, string? AvatarUrl, TeamRole Role);

public record TeamSummaryDto(Guid Id, string Name, string? Description, TeamVisibility Visibility, int MemberCount, TeamRole? MyRole);

public record TeamDetailDto(
    Guid Id,
    string Name,
    string? Description,
    TeamVisibility Visibility,
    int MemberCount,
    TeamRole? MyRole,
    DateTimeOffset CreatedAt,
    List<TeamMemberDto> Members
);

public record InviteLinkResponse(string? InviteUrl);
