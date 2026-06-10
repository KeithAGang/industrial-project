using System.Security.Claims;
using Nepsis.Api.Data;
using Nepsis.Api.DTOs.Users;
using Nepsis.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Nepsis.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var total = await db.Users.CountAsync();
        var items = await db.Users
            .OrderBy(u => u.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { Items = items.Select(MapDto), TotalCount = total, Page = page, PageSize = pageSize });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        if (!Enum.TryParse<UserRole>(dto.Role, out var role))
            return BadRequest(new { message = "Invalid role. Allowed values: Admin, Manager." });

        if (await db.Users.AnyAsync(u => u.Email == dto.Email.Trim()))
            return BadRequest(new { message = "A user with that email already exists." });

        var user = new User
        {
            Email        = dto.Email.Trim().ToLowerInvariant(),
            FullName     = dto.FullName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role         = role,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(List), MapDto(user));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserDto dto)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.FullName))
            user.FullName = dto.FullName.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Role))
        {
            if (!Enum.TryParse<UserRole>(dto.Role, out var role))
                return BadRequest(new { message = "Invalid role. Allowed values: Admin, Manager." });
            user.Role = role;
        }

        if (!string.IsNullOrWhiteSpace(dto.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        await db.SaveChangesAsync();
        return Ok(MapDto(user));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == currentUserId)
            return BadRequest(new { message = "You cannot delete your own account." });

        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static UserListDto MapDto(User u) =>
        new(u.Id, u.Email, u.FullName, u.Role.ToString(), u.CreatedAt);
}
