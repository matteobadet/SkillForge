using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Minio;
using SkillForge.Api.Data;
using SkillForge.Api.Options;
using SkillForge.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ---- Configuration ----

var jwtOptions = new JwtOptions
{
    SigningKey = builder.Configuration["JWT_SIGNING_KEY"] ?? throw new InvalidOperationException("JWT_SIGNING_KEY is required"),
    Issuer = builder.Configuration["JWT_ISSUER"] ?? "skillforge",
};
builder.Services.Configure<JwtOptions>(o =>
{
    o.SigningKey = jwtOptions.SigningKey;
    o.Issuer = jwtOptions.Issuer;
});

var minioOptions = new MinioOptions
{
    Endpoint = builder.Configuration["MINIO_ENDPOINT"] ?? "storage:9000",
    PublicEndpoint = builder.Configuration["MINIO_PUBLIC_ENDPOINT"] ?? "localhost:9000",
    AccessKey = builder.Configuration["MINIO_ROOT_USER"] ?? throw new InvalidOperationException("MINIO_ROOT_USER is required"),
    SecretKey = builder.Configuration["MINIO_ROOT_PASSWORD"] ?? throw new InvalidOperationException("MINIO_ROOT_PASSWORD is required"),
    AvatarsBucket = builder.Configuration["MINIO_BUCKET_AVATARS"] ?? "avatars",
    ResourcesBucket = builder.Configuration["MINIO_BUCKET_RESOURCES"] ?? "resources",
    UseSsl = false,
};
builder.Services.Configure<MinioOptions>(o =>
{
    o.Endpoint = minioOptions.Endpoint;
    o.PublicEndpoint = minioOptions.PublicEndpoint;
    o.AccessKey = minioOptions.AccessKey;
    o.SecretKey = minioOptions.SecretKey;
    o.AvatarsBucket = minioOptions.AvatarsBucket;
    o.ResourcesBucket = minioOptions.ResourcesBucket;
    o.UseSsl = minioOptions.UseSsl;
});

var connectionString =
    $"Host={builder.Configuration["POSTGRES_HOST"] ?? "db"};" +
    $"Port={builder.Configuration["POSTGRES_PORT"] ?? "5432"};" +
    $"Database={builder.Configuration["POSTGRES_DB"] ?? "skillforge"};" +
    $"Username={builder.Configuration["POSTGRES_USER"] ?? "skillforge"};" +
    $"Password={builder.Configuration["POSTGRES_PASSWORD"]}";

// ---- Services ----

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

builder.Services.AddKeyedSingleton<IMinioClient>("internal", (_, _) => new MinioClient()
    .WithEndpoint(minioOptions.Endpoint)
    .WithCredentials(minioOptions.AccessKey, minioOptions.SecretKey)
    .WithSSL(minioOptions.UseSsl)
    .Build());

builder.Services.AddKeyedSingleton<IMinioClient>("public", (_, _) => new MinioClient()
    .WithEndpoint(minioOptions.PublicEndpoint)
    .WithCredentials(minioOptions.AccessKey, minioOptions.SecretKey)
    .WithSSL(minioOptions.UseSsl)
    .Build());

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ObjectStorageService>();
builder.Services.AddScoped<TeamService>();
builder.Services.AddScoped<ResourceService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Keep short claim names (e.g. "sub") as issued instead of the default
        // remapping to long ClaimTypes URIs (e.g. ClaimTypes.NameIdentifier).
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Issuer,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });
builder.Services.AddAuthorization();

var frontendOrigin = builder.Configuration["FRONTEND_ORIGIN"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(frontendOrigin).AllowAnyHeader().AllowAnyMethod());
});

builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddOpenApi();

var app = builder.Build();

// ---- Startup: migrations + bucket ----

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    var objectStorage = scope.ServiceProvider.GetRequiredService<ObjectStorageService>();
    await objectStorage.EnsureBucketExistsAsync(minioOptions.AvatarsBucket);
    await objectStorage.EnsureBucketExistsAsync(minioOptions.ResourcesBucket);
}

// ---- Pipeline ----

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", async (AppDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();
    return canConnect ? Results.Ok(new { status = "ok" }) : Results.StatusCode(503);
});

app.Run();
