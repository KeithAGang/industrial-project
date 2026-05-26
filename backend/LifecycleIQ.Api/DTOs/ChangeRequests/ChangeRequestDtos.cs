using System.ComponentModel.DataAnnotations;
using LifecycleIQ.Api.Models;

namespace LifecycleIQ.Api.DTOs.ChangeRequests;

public record CreateChangeRequestDto(
    [Required] Guid SolutionId,
    [Required, MaxLength(150)] string Title,
    [Required, MinLength(10)] string Description,
    ChangeRequestPriority Priority
);

public record UpdateChangeRequestStatusDto([Required] string Status);

public record ChangeRequestDto(
    Guid Id,
    Guid SolutionId,
    string SolutionName,
    Guid RequestedById,
    string RequestedByName,
    string Title,
    string Description,
    string Status,
    string Priority,
    DateTime CreatedAt,
    DateTime? ResolvedAt
);
