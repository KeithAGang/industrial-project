namespace Nepsis.Api.Models;

public class ChangeRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SolutionId { get; set; }
    public Guid RequestedById { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ChangeRequestStatus Status { get; set; } = ChangeRequestStatus.Pending;
    public ChangeRequestPriority Priority { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public Guid? ResolvedById { get; set; }

    public Solution Solution { get; set; } = null!;
    public User RequestedBy { get; set; } = null!;
    public User? ResolvedBy { get; set; }
}
