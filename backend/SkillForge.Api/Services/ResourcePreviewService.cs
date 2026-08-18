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
                var fullContent = await reader.ReadToEndAsync();

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
}
