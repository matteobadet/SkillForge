using Microsoft.EntityFrameworkCore;
using SkillForge.Api.Models;

namespace SkillForge.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<TeamInviteLink> TeamInviteLinks => Set<TeamInviteLink>();
    public DbSet<Resource> Resources => Set<Resource>();
    public DbSet<ResourceUpvote> ResourceUpvotes => Set<ResourceUpvote>();
    public DbSet<ResourceVersion> ResourceVersions => Set<ResourceVersion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.Pseudo).IsUnique();
            entity.Property(u => u.Role).HasConversion<string>();
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");
            entity.HasIndex(t => t.TokenHash).IsUnique();
            entity.HasOne(t => t.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Team>(entity =>
        {
            entity.ToTable("teams");
            entity.Property(t => t.Visibility).HasConversion<string>();
        });

        modelBuilder.Entity<TeamMember>(entity =>
        {
            entity.ToTable("team_members");
            entity.Property(m => m.Role).HasConversion<string>();
            entity.HasIndex(m => new { m.TeamId, m.UserId }).IsUnique();
            entity.HasOne(m => m.Team)
                .WithMany(t => t.Members)
                .HasForeignKey(m => m.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TeamInviteLink>(entity =>
        {
            entity.ToTable("team_invite_links");
            entity.HasIndex(l => l.Token).IsUnique();
            entity.HasOne(l => l.Team)
                .WithMany(t => t.InviteLinks)
                .HasForeignKey(l => l.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Resource>(entity =>
        {
            entity.ToTable("resources");
            entity.Property(r => r.Type).HasConversion<string>();
            entity.HasIndex(r => new { r.TeamId, r.Name }).IsUnique();
            entity.HasOne(r => r.Team)
                .WithMany()
                .HasForeignKey(r => r.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.PublisherUser)
                .WithMany()
                .HasForeignKey(r => r.PublisherUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ResourceUpvote>(entity =>
        {
            entity.ToTable("resource_upvotes");
            entity.HasIndex(u => new { u.ResourceId, u.UserId }).IsUnique();
            entity.HasOne(u => u.Resource)
                .WithMany(r => r.Upvotes)
                .HasForeignKey(u => u.ResourceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(u => u.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ResourceVersion>(entity =>
        {
            entity.ToTable("resource_versions");
            entity.HasIndex(v => new { v.ResourceId, v.VersionNumber }).IsUnique();
            entity.HasOne(v => v.Resource)
                .WithMany(r => r.Versions)
                .HasForeignKey(v => v.ResourceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(v => v.CreatedByUser)
                .WithMany()
                .HasForeignKey(v => v.CreatedByUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
