using System.IO.Compression;
using System.Text;
using SkillForge.Api.Services;
using Xunit;

namespace SkillForge.Api.Tests;

public class ResourcePreviewServiceTests
{
    private static MemoryStream BuildZip(params (string entryName, string content)[] entries)
    {
        var stream = new MemoryStream();
        using (var zip = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var (entryName, content) in entries)
            {
                var entry = zip.CreateEntry(entryName);
                using var writer = new StreamWriter(entry.Open(), Encoding.UTF8);
                writer.Write(content);
            }
        }
        stream.Position = 0;
        return stream;
    }

    [Fact]
    public async Task ExtractPreviewAsync_FindsSkillMdAtRoot()
    {
        using var zip = BuildZip(("SKILL.md", "# Mon Skill"));
        var result = await new ResourcePreviewService().ExtractPreviewAsync(zip);

        Assert.True(result.Available);
        Assert.Equal("SKILL.md", result.FileName);
        Assert.Equal("# Mon Skill", result.Content);
        Assert.False(result.Truncated);
    }

    [Fact]
    public async Task ExtractPreviewAsync_PrefersSkillMdOverReadme()
    {
        using var zip = BuildZip(("README.md", "readme content"), ("SKILL.md", "skill content"));
        var result = await new ResourcePreviewService().ExtractPreviewAsync(zip);

        Assert.True(result.Available);
        Assert.Equal("SKILL.md", result.FileName);
        Assert.Equal("skill content", result.Content);
    }

    [Fact]
    public async Task ExtractPreviewAsync_FallsBackToReadmeWhenNoSkillMd()
    {
        using var zip = BuildZip(("README.md", "readme only"));
        var result = await new ResourcePreviewService().ExtractPreviewAsync(zip);

        Assert.True(result.Available);
        Assert.Equal("README.md", result.FileName);
    }

    [Fact]
    public async Task ExtractPreviewAsync_IsCaseInsensitive()
    {
        using var zip = BuildZip(("skill.md", "lowercase"));
        var result = await new ResourcePreviewService().ExtractPreviewAsync(zip);

        Assert.True(result.Available);
        Assert.Equal("skill.md", result.FileName);
    }

    [Fact]
    public async Task ExtractPreviewAsync_IgnoresFilesInSubfolders()
    {
        using var zip = BuildZip(("docs/README.md", "nested, should be ignored"));
        var result = await new ResourcePreviewService().ExtractPreviewAsync(zip);

        Assert.False(result.Available);
        Assert.Null(result.FileName);
        Assert.Null(result.Content);
    }

    [Fact]
    public async Task ExtractPreviewAsync_NoCandidateFile_ReturnsUnavailable()
    {
        using var zip = BuildZip(("main.py", "print('hello')"));
        var result = await new ResourcePreviewService().ExtractPreviewAsync(zip);

        Assert.False(result.Available);
        Assert.Null(result.FileName);
        Assert.Null(result.Content);
        Assert.False(result.Truncated);
    }

    [Fact]
    public async Task ExtractPreviewAsync_TruncatesContentBeyondLimit()
    {
        var longContent = new string('a', 150_000);
        using var zip = BuildZip(("SKILL.md", longContent));
        var result = await new ResourcePreviewService().ExtractPreviewAsync(zip);

        Assert.True(result.Available);
        Assert.True(result.Truncated);
        Assert.Equal(100_000, result.Content!.Length);
    }

    [Fact]
    public async Task ExtractPreviewAsync_CorruptedArchive_ReturnsUnavailable()
    {
        using var notAZip = new MemoryStream(Encoding.UTF8.GetBytes("this is not a zip file"));
        var result = await new ResourcePreviewService().ExtractPreviewAsync(notAZip);

        Assert.False(result.Available);
        Assert.Null(result.FileName);
        Assert.Null(result.Content);
    }
}
