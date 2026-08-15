namespace SkillForge.Api.Options;

public class MinioOptions
{
    public const string SectionName = "Minio";

    public required string Endpoint { get; set; }
    /// <summary>Endpoint reachable from the browser, used only to sign avatar URLs (internal Docker hostnames aren't resolvable client-side).</summary>
    public required string PublicEndpoint { get; set; }
    public required string AccessKey { get; set; }
    public required string SecretKey { get; set; }
    public required string AvatarsBucket { get; set; }
    public required string ResourcesBucket { get; set; }
    public bool UseSsl { get; set; } = false;
}
