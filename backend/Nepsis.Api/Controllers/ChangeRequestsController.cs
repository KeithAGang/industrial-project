using System.Security.Claims;
using Nepsis.Api.Data;
using Nepsis.Api.DTOs.ChangeRequests;
using Nepsis.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Nepsis.Api.Controllers;

[ApiController]
[Route("api/change-requests")]
[Authorize]
public class ChangeRequestsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] Guid? solutionId,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = db.ChangeRequests
            .Include(cr => cr.Solution)
            .Include(cr => cr.RequestedBy)
            .AsQueryable();

        if (solutionId.HasValue) query = query.Where(cr => cr.SolutionId == solutionId);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ChangeRequestStatus>(status, out var s))
            query = query.Where(cr => cr.Status == s);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(cr => cr.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { Items = items.Select(MapDto), TotalCount = total, Page = page, PageSize = pageSize });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateChangeRequestDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var solution = await db.Solutions.FindAsync(dto.SolutionId);
        if (solution is null) return BadRequest(new { message = "Solution not found." });

        var cr = new ChangeRequest
        {
            SolutionId      = dto.SolutionId,
            RequestedById   = userId,
            Title           = dto.Title,
            Description     = dto.Description,
            Priority        = dto.Priority,
        };

        db.ChangeRequests.Add(cr);
        await db.SaveChangesAsync();

        cr = await db.ChangeRequests
            .Include(c => c.Solution)
            .Include(c => c.RequestedBy)
            .FirstAsync(c => c.Id == cr.Id);

        return CreatedAtAction(nameof(List), MapDto(cr));
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateChangeRequestStatusDto dto)
    {
        if (!Enum.TryParse<ChangeRequestStatus>(dto.Status, out var newStatus))
            return BadRequest(new { message = "Invalid status value." });

        var cr = await db.ChangeRequests
            .Include(c => c.Solution)
            .Include(c => c.RequestedBy)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cr is null) return NotFound();

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        cr.Status = newStatus;

        if (newStatus is ChangeRequestStatus.Approved or ChangeRequestStatus.Rejected or ChangeRequestStatus.Completed)
        {
            cr.ResolvedAt   = DateTime.UtcNow;
            cr.ResolvedById = userId;
        }

        await db.SaveChangesAsync();
        return Ok(MapDto(cr));
    }

    private static ChangeRequestDto MapDto(ChangeRequest cr) => new(
        cr.Id, cr.SolutionId, cr.Solution.Name,
        cr.RequestedById, cr.RequestedBy.FullName,
        cr.Title, cr.Description,
        cr.Status.ToString(), cr.Priority.ToString(),
        cr.CreatedAt, cr.ResolvedAt
    );
}
