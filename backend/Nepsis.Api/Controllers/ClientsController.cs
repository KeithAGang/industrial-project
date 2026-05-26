using Nepsis.Api.Data;
using Nepsis.Api.DTOs.Clients;
using Nepsis.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Nepsis.Api.Controllers;

[ApiController]
[Route("api/clients")]
[Authorize]
public class ClientsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = db.Clients.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Name.Contains(search) || c.ContactPerson.Contains(search));

        var total = await query.CountAsync();
        var items = await query
            .Include(c => c.Solutions)
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            Items = items.Select(MapDto),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var c = await db.Clients.Include(c => c.Solutions).FirstOrDefaultAsync(c => c.Id == id);
        if (c is null) return NotFound();
        return Ok(MapDto(c));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateClientDto dto)
    {
        var client = new Client
        {
            Name          = dto.Name,
            ContactPerson = dto.ContactPerson,
            Email         = dto.Email,
            Phone         = dto.Phone,
        };
        db.Clients.Add(client);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = client.Id }, MapDto(client));
    }

    private static ClientDto MapDto(Client c) => new(
        c.Id, c.Name, c.ContactPerson, c.Email, c.Phone,
        c.Solutions.Count(s => s.IsActive),
        c.CreatedAt
    );
}
