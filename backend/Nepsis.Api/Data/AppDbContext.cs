using Nepsis.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Nepsis.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Solution> Solutions => Set<Solution>();
    public DbSet<ShiRecord> ShiRecords => Set<ShiRecord>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ChangeRequest> ChangeRequests => Set<ChangeRequest>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasConversion<string>();
        });

        mb.Entity<Client>(e => e.HasKey(c => c.Id));

        mb.Entity<Solution>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.SlaTier).HasConversion<string>();
            e.Property(s => s.SlaComplianceStatus).HasConversion<string>();
            e.HasOne(s => s.Client)
             .WithMany(c => c.Solutions)
             .HasForeignKey(s => s.ClientId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        mb.Entity<ShiRecord>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.RiskTier).HasConversion<string>();
            e.HasIndex(r => new { r.SolutionId, r.ComputedAt });
            e.HasOne(r => r.Solution)
             .WithMany(s => s.ShiRecords)
             .HasForeignKey(r => r.SolutionId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<Notification>(e =>
        {
            e.HasKey(n => n.Id);
            e.Property(n => n.Type).HasConversion<string>();
            e.HasIndex(n => new { n.UserId, n.IsRead });
            e.HasOne(n => n.Solution)
             .WithMany(s => s.Notifications)
             .HasForeignKey(n => n.SolutionId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(n => n.User)
             .WithMany(u => u.Notifications)
             .HasForeignKey(n => n.UserId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        mb.Entity<ChangeRequest>(e =>
        {
            e.HasKey(cr => cr.Id);
            e.Property(cr => cr.Status).HasConversion<string>();
            e.Property(cr => cr.Priority).HasConversion<string>();
            e.HasOne(cr => cr.Solution)
             .WithMany(s => s.ChangeRequests)
             .HasForeignKey(cr => cr.SolutionId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(cr => cr.RequestedBy)
             .WithMany(u => u.RequestedChangeRequests)
             .HasForeignKey(cr => cr.RequestedById)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(cr => cr.ResolvedBy)
             .WithMany(u => u.ResolvedChangeRequests)
             .HasForeignKey(cr => cr.ResolvedById)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
