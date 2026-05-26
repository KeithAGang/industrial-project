using Nepsis.Api.Data;
using Nepsis.Api.Models;

namespace Nepsis.Api.Services;

public class NotificationService(AppDbContext db)
{
    public async Task CreateForShiAsync(Solution solution, ShiRecord record)
    {
        var type = record.RiskTier switch
        {
            RiskTier.Critical => NotificationType.Critical,
            RiskTier.High     => NotificationType.High,
            RiskTier.Medium   => NotificationType.Medium,
            _                 => NotificationType.Low
        };

        var title = $"{record.RiskTier} Risk: {solution.Name}";
        var message = $"SHI score computed at {record.ShiScore:F2}. " +
                      $"Licence urgency: {record.LicenceUrgencyScore:F2}, " +
                      $"Version gap: {record.VersionGapScore:F2}, " +
                      $"SLA compliance: {record.SlaComplianceScore:F2}, " +
                      $"Maintenance recency: {record.MaintenanceRecencyScore:F2}.";

        // Broadcast to all admins (UserId = null means visible to all admins)
        if (record.RiskTier is RiskTier.Critical or RiskTier.High)
        {
            db.Notifications.Add(new Notification
            {
                SolutionId = solution.Id,
                UserId = null,
                Type = type,
                Title = title,
                Message = message
            });
            await db.SaveChangesAsync();
        }
    }
}
