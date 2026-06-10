using System.ComponentModel.DataAnnotations;

namespace Nepsis.Api.DTOs.Users;

public record UserListDto(
    Guid   Id,
    string Email,
    string FullName,
    string Role,
    DateTime CreatedAt
);

public record CreateUserDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(1)] string FullName,
    [Required, MinLength(6)] string Password,
    [Required]               string Role
);

public record UpdateUserDto(
    string? FullName,
    string? Role,
    string? Password
);
