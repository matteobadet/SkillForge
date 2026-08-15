using Microsoft.Extensions.DependencyInjection;
using Minio;
using Minio.DataModel.Args;

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
}
