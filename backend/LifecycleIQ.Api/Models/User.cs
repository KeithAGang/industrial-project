namespace LifecycleIQ.Api.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Manager;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Notification> Notifications { get; set; } = [];
    public ICollection<ChangeRequest> RequestedChangeRequests { get; set; } = [];
    public ICollection<ChangeRequest> ResolvedChangeRequests { get; set; } = [];
}
