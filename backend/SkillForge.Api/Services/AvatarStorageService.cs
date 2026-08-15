using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using SkillForge.Api.Options;

namespace SkillForge.Api.Services;

public class AvatarStorageService(
    [FromKeyedServices("internal")] IMinioClient minio,
    [FromKeyedServices("public")] IMinioClient publicMinio,
    IOptions<MinioOptions> minioOptions)
{
    private readonly string _bucket = minioOptions.Value.AvatarsBucket;

    public async Task EnsureBucketExistsAsync(CancellationToken ct = default)
    {
        var exists = await minio.BucketExistsAsync(new BucketExistsArgs().WithBucket(_bucket), ct);
        if (!exists)
        {
            await minio.MakeBucketAsync(new MakeBucketArgs().WithBucket(_bucket), ct);
        }
    }

    public async Task<string> UploadAvatarAsync(Guid userId, Stream content, long size, string contentType, CancellationToken ct = default)
    {
        var objectKey = $"{userId}/{Guid.NewGuid()}";

        await minio.PutObjectAsync(new PutObjectArgs()
            .WithBucket(_bucket)
            .WithObject(objectKey)
            .WithStreamData(content)
            .WithObjectSize(size)
            .WithContentType(contentType), ct);

        return objectKey;
    }

    public async Task<string> GetAvatarUrlAsync(string objectKey, CancellationToken ct = default)
    {
        return await publicMinio.PresignedGetObjectAsync(new PresignedGetObjectArgs()
            .WithBucket(_bucket)
            .WithObject(objectKey)
            .WithExpiry(60 * 60));
    }

    public async Task DeleteAvatarAsync(string objectKey, CancellationToken ct = default)
    {
        await minio.RemoveObjectAsync(new RemoveObjectArgs()
            .WithBucket(_bucket)
            .WithObject(objectKey), ct);
    }
}
