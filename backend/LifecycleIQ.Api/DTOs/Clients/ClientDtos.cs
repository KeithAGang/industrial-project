using System.ComponentModel.DataAnnotations;

namespace LifecycleIQ.Api.DTOs.Clients;

public record CreateClientDto(
    [Required, MaxLength(100)] string Name,
    [Required] string ContactPerson,
    [Required, EmailAddress] string Email,
    string? Phone
);

public record ClientDto(
    Guid Id,
    string Name,
    string ContactPerson,
    string Email,
    string? Phone,
    int SolutionCount,
    DateTime CreatedAt
);
