using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace SkillForge.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? throw new InvalidOperationException("Missing sub claim");
        return Guid.Parse(sub);
    }
}
