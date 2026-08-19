namespace SkillForge.Api.Models.Dtos;

public record StorageUsageDto(long TotalBytes, DateTimeOffset ComputedAt, List<BucketUsageDto> Buckets);

public record BucketUsageDto(string Bucket, string Label, int ObjectCount, long TotalBytes);
