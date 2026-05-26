using System.Security.Claims;
using Nepsis.Api.Data;
using Nepsis.Api.DTOs.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Nepsis.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var query = db.Notifications
            .Include(n => n.Solution)
            .Where(n => n.UserId == userId || n.UserId == null);

        if (unreadOnly) query = query.Where(n => !n.IsRead);

        var total   = await query.CountAsync();
        var unread  = await db.Notifications.CountAsync(n => (n.UserId == userId || n.UserId == null) && !n.IsRead);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(n => new NotificationDto(
            n.Id, n.SolutionId, n.Solution.Name, n.Type.ToString(),
            n.Title, n.Message, n.IsRead, n.CreatedAt));

        return Ok(new NotificationPagedResult(dtos, total, unread, page, pageSize));
    }

    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var n = await db.Notifications.FindAsync(id);
        if (n is null) return NotFound();
        n.IsRead = true;
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await db.Notifications
            .Where(n => (n.UserId == userId || n.UserId == null) && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        return Ok();
    }
}
