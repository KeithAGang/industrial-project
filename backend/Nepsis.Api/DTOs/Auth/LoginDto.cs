using System.ComponentModel.DataAnnotations;

namespace Nepsis.Api.DTOs.Auth;

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password
);
