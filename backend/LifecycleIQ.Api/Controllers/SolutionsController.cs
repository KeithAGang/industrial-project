using System.Security.Claims;
using LifecycleIQ.Api.Data;
using LifecycleIQ.Api.DTOs.Solutions;
using LifecycleIQ.Api.Models;
using LifecycleIQ.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LifecycleIQ.Api.Controllers;

[ApiController]
[Route("api/solutions")]
[Authorize]
public class SolutionsController(AppDbContext db, WfaService wfa) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? riskTier,
        [FromQuery] Guid? clientId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = db.Solutions
            .Where(s => s.IsActive)
            .Include(s => s.Client)
            .Include(s => s.ShiRecords.OrderByDescending(r => r.ComputedAt).Take(1))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s => s.Name.Contains(search) || s.Client.Name.Contains(search));

        if (clientId.HasValue)
            query = query.Where(s => s.ClientId == clientId);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(s => MapToDto(s, s.ShiRecords.FirstOrDefault()));

        if (!string.IsNullOrEmpty(riskTier) && Enum.TryParse<RiskTier>(riskTier, out var tier))
            dtos = dtos.Where(d => d.LatestShi?.RiskTier == tier.ToString());

        return Ok(new PagedResult<SolutionDto>(dtos, total, page, pageSize));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var s = await db.Solutions
            .Include(s => s.Client)
            .Include(s => s.ShiRecords.OrderByDescending(r => r.ComputedAt).Take(1))
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive);

        if (s is null) return NotFound();
        return Ok(MapToDto(s, s.ShiRecords.FirstOrDefault()));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateSolutionDto dto)
    {
        var client = await db.Clients.FindAsync(dto.ClientId);
        if (client is null) return BadRequest(new { message = "Client not found." });

        var solution = new Solution
        {
            ClientId            = dto.ClientId,
            Name                = dto.Name,
            Description         = dto.Description,
            CurrentVersion      = dto.CurrentVersion,
            LatestVersion       = dto.LatestVersion,
            LicenceKey          = dto.LicenceKey,
            LicenceExpiryDate   = dto.LicenceExpiryDate.ToUniversalTime(),
            SlaTier             = dto.SlaTier,
            SlaComplianceStatus = dto.SlaComplianceStatus,
            LastMaintenanceDate = dto.LastMaintenanceDate.ToUniversalTime(),
        };

        db.Solutions.Add(solution);
        await db.SaveChangesAsync();

        solution = await db.Solutions
            .Include(s => s.Client)
            .FirstAsync(s => s.Id == solution.Id);

        return CreatedAtAction(nameof(Get), new { id = solution.Id }, MapToDto(solution, null));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSolutionDto dto)
    {
        var s = await db.Solutions.Include(s => s.Client).FirstOrDefaultAsync(s => s.Id == id && s.IsActive);
        if (s is null) return NotFound();

        if (dto.Name is not null) s.Name = dto.Name;
        if (dto.Description is not null) s.Description = dto.Description;
        if (dto.CurrentVersion is not null) s.CurrentVersion = dto.CurrentVersion;
        if (dto.LatestVersion is not null) s.LatestVersion = dto.LatestVersion;
        if (dto.LicenceKey is not null) s.LicenceKey = dto.LicenceKey;
        if (dto.LicenceExpiryDate.HasValue) s.LicenceExpiryDate = dto.LicenceExpiryDate.Value.ToUniversalTime();
        if (dto.SlaTier.HasValue) s.SlaTier = dto.SlaTier.Value;
        if (dto.SlaComplianceStatus.HasValue) s.SlaComplianceStatus = dto.SlaComplianceStatus.Value;
        if (dto.LastMaintenanceDate.HasValue) s.LastMaintenanceDate = dto.LastMaintenanceDate.Value.ToUniversalTime();
        s.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(MapToDto(s, null));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var s = await db.Solutions.FindAsync(id);
        if (s is null) return NotFound();

        s.IsActive  = false;
        s.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/compute-shi")]
    public async Task<IActionResult> ComputeShi(Guid id)
    {
        var s = await db.Solutions.FirstOrDefaultAsync(s => s.Id == id && s.IsActive);
        if (s is null) return NotFound();

        var record = await wfa.ComputeAsync(s);
        return Ok(MapShiDto(record));
    }

    [HttpGet("{id:guid}/shi-history")]
    public async Task<IActionResult> ShiHistory(Guid id)
    {
        var records = await db.ShiRecords
            .Where(r => r.SolutionId == id)
            .OrderByDescending(r => r.ComputedAt)
            .Take(30)
            .ToListAsync();

        return Ok(records.Select(MapShiDto));
    }

    private static SolutionDto MapToDto(Solution s, ShiRecord? latest) => new(
        s.Id, s.ClientId, s.Client.Name, s.Name, s.Description,
        s.CurrentVersion, s.LatestVersion, s.LicenceKey,
        s.LicenceExpiryDate, s.SlaTier.ToString(), s.SlaComplianceStatus.ToString(),
        s.LastMaintenanceDate, s.IsActive,
        latest is null ? null : MapShiDto(latest),
        s.CreatedAt, s.UpdatedAt
    );

    private static ShiRecordDto MapShiDto(ShiRecord r) => new(
        r.Id, r.SolutionId, r.ShiScore, r.RiskTier.ToString(),
        r.LicenceUrgencyScore, r.VersionGapScore, r.SlaComplianceScore, r.MaintenanceRecencyScore,
        r.LicenceUrgencyWeight, r.VersionGapWeight, r.SlaComplianceWeight, r.MaintenanceRecencyWeight,
        r.AiBriefing, r.ComputedAt
    );
}
