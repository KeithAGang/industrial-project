namespace Nepsis.Api.Models;

public class ShiRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SolutionId { get; set; }
    public double ShiScore { get; set; }
    public RiskTier RiskTier { get; set; }
    public double LicenceUrgencyScore { get; set; }
    public double VersionGapScore { get; set; }
    public double SlaComplianceScore { get; set; }
    public double MaintenanceRecencyScore { get; set; }
    public double LicenceUrgencyWeight { get; set; }
    public double VersionGapWeight { get; set; }
    public double SlaComplianceWeight { get; set; }
    public double MaintenanceRecencyWeight { get; set; }
    public string? AiBriefing { get; set; }
    public DateTime ComputedAt { get; set; } = DateTime.UtcNow;

    public Solution Solution { get; set; } = null!;
}
