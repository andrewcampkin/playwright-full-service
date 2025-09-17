using Microsoft.EntityFrameworkCore;
using PlaywrightService.Models.Entities;

namespace PlaywrightService.Data;

public class PlaywrightDbContext : DbContext
{
    public PlaywrightDbContext(DbContextOptions<PlaywrightDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<Website> Websites { get; set; }
    public DbSet<TestSuite> TestSuites { get; set; }
    public DbSet<TestCase> TestCases { get; set; }
    public DbSet<TestExecution> TestExecutions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired();
        });

        // Project configuration
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                  .WithMany(e => e.Projects)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Website configuration
        modelBuilder.Entity<Website>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Url);
            entity.HasOne(e => e.Project)
                  .WithMany(e => e.Websites)
                  .HasForeignKey(e => e.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // TestSuite configuration
        modelBuilder.Entity<TestSuite>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Website)
                  .WithMany(e => e.TestSuites)
                  .HasForeignKey(e => e.WebsiteId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // TestCase configuration
        modelBuilder.Entity<TestCase>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.TestSuite)
                  .WithMany(e => e.TestCases)
                  .HasForeignKey(e => e.TestSuiteId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // TestExecution configuration
        modelBuilder.Entity<TestExecution>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.TestCase)
                  .WithMany(e => e.TestExecutions)
                  .HasForeignKey(e => e.TestCaseId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
