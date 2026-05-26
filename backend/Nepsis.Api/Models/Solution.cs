namespace Nepsis.Api.Models;

public class Solution
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string CurrentVersion { get; set; } = string.Empty;
    public string LatestVersion { get; set; } = string.Empty;
    public string? LicenceKey { get; set; }
    public DateTime LicenceExpiryDate { get; set; }
    public SlaTier SlaTier { get; set; }
    public SlaComplianceStatus SlaComplianceStatus { get; set; } = SlaComplianceStatus.Compliant;
    public DateTime LastMaintenanceDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Client Client { get; set; } = null!;
    public ICollection<ShiRecord> ShiRecords { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
    public ICollection<ChangeRequest> ChangeRequests { get; set; } = [];
}
