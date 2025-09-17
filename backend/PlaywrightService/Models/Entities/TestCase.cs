using System.ComponentModel.DataAnnotations;

namespace PlaywrightService.Models.Entities;

public class TestCase
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    public string Steps { get; set; } = string.Empty; // JSON serialized test steps

    public Guid TestSuiteId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual TestSuite TestSuite { get; set; } = null!;
    public virtual ICollection<TestExecution> TestExecutions { get; set; } = new List<TestExecution>();
}
