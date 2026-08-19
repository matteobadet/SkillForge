using Microsoft.Extensions.DependencyInjection;
using Minio;
using Minio.DataModel.Args;
using SkillForge.Api.Models.Dtos;

namespace SkillForge.Api.Services;

/// <summary>Generic MinIO object storage, parameterized by bucket. Content-type/size validation is the caller's responsibility.</summary>
public class ObjectStorageService(
    [FromKeyedServices("internal")] IMinioClient minio,
    [FromKeyedServices("public")] IMinioClient publicMinio)
{
    public async Task EnsureBucketExistsAsync(string bucket, CancellationToken ct = default)
    {
        var exists = await minio.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucket), ct);
        if (!exists)
        {
            await minio.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucket), ct);
        }
    }

    public async Task<string> UploadAsync(string bucket, string objectKey, Stream content, long size, string contentType, CancellationToken ct = default)
    {
        await minio.PutObjectAsync(new PutObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectKey)
            .WithStreamData(content)
            .WithObjectSize(size)
            .WithContentType(contentType), ct);

        return objectKey;
    }

    public async Task<MemoryStream> DownloadToMemoryAsync(string bucket, string objectKey, CancellationToken ct = default)
    {
        var memoryStream = new MemoryStream();
        await minio.GetObjectAsync(new GetObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectKey)
            .WithCallbackStream(async (stream, innerCt) => await stream.CopyToAsync(memoryStream, innerCt)), ct);
        memoryStream.Position = 0;
        return memoryStream;
    }

    public async Task<string> GetPresignedUrlAsync(string bucket, string objectKey, CancellationToken ct = default)
    {
        return await publicMinio.PresignedGetObjectAsync(new PresignedGetObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectKey)
            .WithExpiry(60 * 60));
    }

    public async Task DeleteAsync(string bucket, string objectKey, CancellationToken ct = default)
    {
        await minio.RemoveObjectAsync(new RemoveObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectKey), ct);
    }

    /// <summary>Sums object sizes/counts per bucket by listing live from MinIO — no size tracked in the database.</summary>
    public async Task<StorageUsageDto> GetUsageAsync(IEnumerable<(string Bucket, string Label)> buckets, CancellationToken ct = default)
    {
        var bucketUsages = new List<BucketUsageDto>();
        foreach (var (bucket, label) in buckets)
        {
            long bucketBytes = 0;
            var objectCount = 0;
            var args = new ListObjectsArgs().WithBucket(bucket).WithRecursive(true);
            await foreach (var item in minio.ListObjectsEnumAsync(args, ct))
            {
                bucketBytes += (long)item.Size;
                objectCount++;
            }
            bucketUsages.Add(new BucketUsageDto(bucket, label, objectCount, bucketBytes));
        }

        return new StorageUsageDto(bucketUsages.Sum(b => b.TotalBytes), DateTimeOffset.UtcNow, bucketUsages);
    }
}
