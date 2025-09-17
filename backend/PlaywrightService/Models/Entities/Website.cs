using System.ComponentModel.DataAnnotations;

namespace PlaywrightService.Models.Entities;

public class Website
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public Guid ProjectId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Project Project { get; set; } = null!;
    public virtual ICollection<TestSuite> TestSuites { get; set; } = new List<TestSuite>();
}
