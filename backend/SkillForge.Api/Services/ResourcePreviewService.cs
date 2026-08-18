using System.IO.Compression;
using System.Text;
using SkillForge.Api.Models.Dtos;

namespace SkillForge.Api.Services;

public class ResourcePreviewService
{
    private const int MaxContentLength = 100_000;

    // Ordre de priorité : SKILL.md avant README.md (cf. research.md #2).
    private static readonly string[] CandidateFileNames = ["SKILL.md", "README.md"];

    public async Task<ResourcePreviewDto> ExtractPreviewAsync(Stream archiveStream)
    {
        try
        {
            using var zip = new ZipArchive(archiveStream, ZipArchiveMode.Read, leaveOpen: false);

            foreach (var candidateName in CandidateFileNames)
            {
                var entry = zip.Entries.FirstOrDefault(e =>
                    !e.FullName.Contains('/') &&
                    !e.FullName.Contains('\\') &&
                    string.Equals(e.Name, candidateName, StringComparison.OrdinalIgnoreCase));

                if (entry is null) continue;

                using var entryStream = entry.Open();
                using var reader = new StreamReader(entryStream, Encoding.UTF8);
                var fullContent = StripFrontmatter(await reader.ReadToEndAsync());

                var truncated = fullContent.Length > MaxContentLength;
                var content = truncated ? fullContent[..MaxContentLength] : fullContent;

                return new ResourcePreviewDto(true, entry.Name, content, truncated);
            }

            return new ResourcePreviewDto(false, null, null, false);
        }
        catch
        {
            // Archive corrompue, illisible, ou entrée non textuelle : traité
            // comme "aucun aperçu disponible", jamais comme une erreur.
            return new ResourcePreviewDto(false, null, null, false);
        }
    }

    /// <summary>
    /// SKILL.md files conventionally start with a YAML frontmatter block
    /// (---\nname: ...\n---). Left as-is, Markdown misreads the two "---"
    /// lines as a thematic break and a Setext heading — strip the block so
    /// only the actual body is rendered.
    /// </summary>
    private static string StripFrontmatter(string content)
    {
        var lines = content.Replace("\r\n", "\n").TrimStart('﻿').Split('\n');
        if (lines.Length == 0 || lines[0].Trim() != "---") return content;

        for (var i = 1; i < lines.Length; i++)
        {
            if (lines[i].Trim() != "---") continue;
            return string.Join('\n', lines[(i + 1)..]).TrimStart('\n');
        }

        return content; // No closing delimiter found — leave untouched.
    }
}
