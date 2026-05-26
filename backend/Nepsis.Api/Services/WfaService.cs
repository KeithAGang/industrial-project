using Nepsis.Api.Data;
using Nepsis.Api.Models;

namespace Nepsis.Api.Services;

public class WfaService(AppDbContext db, AiBriefingService aiService, NotificationService notifService)
{
    // AHP-derived weights
    private const double W_LICENCE   = 0.40;
    private const double W_VERSION   = 0.25;
    private const double W_SLA       = 0.25;
    private const double W_MAINT     = 0.10;

    public async Task<ShiRecord> ComputeAsync(Solution solution)
    {
        var f1 = NormaliseLicenceUrgency(solution.LicenceExpiryDate);
        var f2 = NormaliseVersionGap(solution.CurrentVersion, solution.LatestVersion);
        var f3 = NormaliseSlaCompliance(solution.SlaComplianceStatus);
        var f4 = NormaliseMaintenanceRecency(solution.LastMaintenanceDate);

        var totalWeight = W_LICENCE + W_VERSION + W_SLA + W_MAINT;
        var shi = (W_LICENCE * f1 + W_VERSION * f2 + W_SLA * f3 + W_MAINT * f4) / totalWeight;

        var record = new ShiRecord
        {
            SolutionId              = solution.Id,
            ShiScore                = Math.Round(shi, 4),
            RiskTier                = ClassifyRisk(shi),
            LicenceUrgencyScore     = Math.Round(f1, 4),
            VersionGapScore         = Math.Round(f2, 4),
            SlaComplianceScore      = Math.Round(f3, 4),
            MaintenanceRecencyScore = Math.Round(f4, 4),
            LicenceUrgencyWeight    = W_LICENCE,
            VersionGapWeight        = W_VERSION,
            SlaComplianceWeight     = W_SLA,
            MaintenanceRecencyWeight= W_MAINT,
        };

        db.ShiRecords.Add(record);
        await db.SaveChangesAsync();

        record.AiBriefing = await aiService.GenerateBriefingAsync(record, solution.Name);
        await db.SaveChangesAsync();

        await notifService.CreateForShiAsync(solution, record);

        return record;
    }

    private static double NormaliseLicenceUrgency(DateTime expiry)
    {
        var days = (expiry - DateTime.UtcNow).TotalDays;
        return days switch
        {
            <= 0   => 1.00,
            <= 7   => 0.95,
            <= 30  => 0.85,
            <= 60  => 0.70,
            <= 90  => 0.55,
            <= 180 => 0.35,
            <= 365 => 0.15,
            _      => 0.05
        };
    }

    private static double NormaliseVersionGap(string current, string latest)
    {
        if (!TryParseVersion(current, out var cur) || !TryParseVersion(latest, out var lat))
            return 0;

        var majorDiff = Math.Max(lat.Major - cur.Major, 0);
        var minorDiff = Math.Max(lat.Minor - cur.Minor, 0);
        var patchDiff = Math.Max(lat.Build  - cur.Build,  0);

        var gap = majorDiff * 10.0 + minorDiff * 2.0 + patchDiff * 0.2;
        return Math.Min(gap / 15.0, 1.0);
    }

    private static bool TryParseVersion(string v, out Version result)
        => Version.TryParse(v.TrimStart('v', 'V'), out result!);

    private static double NormaliseSlaCompliance(SlaComplianceStatus status) => status switch
    {
        SlaComplianceStatus.Breached  => 1.0,
        SlaComplianceStatus.AtRisk    => 0.6,
        SlaComplianceStatus.Compliant => 0.1,
        _                             => 0.1
    };

    private static double NormaliseMaintenanceRecency(DateTime lastMaint)
    {
        var days = (DateTime.UtcNow - lastMaint).TotalDays;
        return days switch
        {
            > 365 => 1.00,
            > 180 => 0.80,
            > 90  => 0.55,
            > 30  => 0.30,
            > 7   => 0.15,
            _     => 0.05
        };
    }

    private static RiskTier ClassifyRisk(double shi) => shi switch
    {
        >= 0.80 => RiskTier.Critical,
        >= 0.60 => RiskTier.High,
        >= 0.40 => RiskTier.Medium,
        _       => RiskTier.Low
    };
}
