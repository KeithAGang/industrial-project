using Nepsis.Api.Data;
using Nepsis.Api.DTOs.Dashboard;
using Nepsis.Api.DTOs.Solutions;
using Nepsis.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Nepsis.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var solutions = await db.Solutions
            .Where(s => s.IsActive)
            .Include(s => s.Client)
            .Include(s => s.ShiRecords.OrderByDescending(r => r.ComputedAt).Take(1))
            .ToListAsync();

        var withShi = solutions
            .Select(s => (Solution: s, Latest: s.ShiRecords.FirstOrDefault()))
            .ToList();

        var critical = withShi.Count(x => x.Latest?.RiskTier == RiskTier.Critical);
        var high     = withShi.Count(x => x.Latest?.RiskTier == RiskTier.High);
        var medium   = withShi.Count(x => x.Latest?.RiskTier == RiskTier.Medium);
        var low      = withShi.Count(x => x.Latest?.RiskTier == RiskTier.Low);

        var scored  = withShi.Where(x => x.Latest is not null).ToList();
        var avgShi  = scored.Count > 0 ? scored.Average(x => x.Latest!.ShiScore) : 0;

        var topRisk = withShi
            .Where(x => x.Latest is not null)
            .OrderByDescending(x => x.Latest!.ShiScore)
            .Take(5)
            .Select(x => MapDto(x.Solution, x.Latest))
            .ToList();

        return Ok(new DashboardStatsDto(solutions.Count, critical, high, medium, low, Math.Round(avgShi, 4), topRisk));
    }

    private static SolutionDto MapDto(Solution s, ShiRecord? r) => new(
        s.Id, s.ClientId, s.Client.Name, s.Name, s.Description,
        s.CurrentVersion, s.LatestVersion, s.LicenceKey,
        s.LicenceExpiryDate, s.SlaTier.ToString(), s.SlaComplianceStatus.ToString(),
        s.LastMaintenanceDate, s.IsActive,
        r is null ? null : new ShiRecordDto(
            r.Id, r.SolutionId, r.ShiScore, r.RiskTier.ToString(),
            r.LicenceUrgencyScore, r.VersionGapScore, r.SlaComplianceScore, r.MaintenanceRecencyScore,
            r.LicenceUrgencyWeight, r.VersionGapWeight, r.SlaComplianceWeight, r.MaintenanceRecencyWeight,
            r.AiBriefing, r.ComputedAt),
        s.CreatedAt, s.UpdatedAt
    );
}
