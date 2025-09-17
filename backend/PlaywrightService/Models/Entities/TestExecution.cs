using System.ComponentModel.DataAnnotations;

namespace PlaywrightService.Models.Entities;

public class TestExecution
{
    public Guid Id { get; set; }

    public Guid TestCaseId { get; set; }

    public TestExecutionStatus Status { get; set; }

    public DateTime StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    [MaxLength(2000)]
    public string? ErrorMessage { get; set; }

    public string? Results { get; set; } // JSON serialized test results

    public int DurationMs { get; set; }

    // Navigation properties
    public virtual TestCase TestCase { get; set; } = null!;
}

public enum TestExecutionStatus
{
    Pending = 0,
    Running = 1,
    Passed = 2,
    Failed = 3,
    Skipped = 4,
    Timeout = 5,
    Error = 6
}
