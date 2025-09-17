using System.ComponentModel.DataAnnotations;

namespace PlaywrightService.Models.Entities;

public class TestSuite
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public Guid WebsiteId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Website Website { get; set; } = null!;
    public virtual ICollection<TestCase> TestCases { get; set; } = new List<TestCase>();
}
