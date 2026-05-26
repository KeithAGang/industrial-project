using System.ComponentModel.DataAnnotations;
using Nepsis.Api.Models;

namespace Nepsis.Api.DTOs.Solutions;

public record CreateSolutionDto(
    [Required] Guid ClientId,
    [Required, MaxLength(100)] string Name,
    string? Description,
    [Required] string CurrentVersion,
    [Required] string LatestVersion,
    string? LicenceKey,
    [Required] DateTime LicenceExpiryDate,
    SlaTier SlaTier,
    SlaComplianceStatus SlaComplianceStatus,
    [Required] DateTime LastMaintenanceDate
);

public record UpdateSolutionDto(
    [MaxLength(100)] string? Name,
    string? Description,
    string? CurrentVersion,
    string? LatestVersion,
    string? LicenceKey,
    DateTime? LicenceExpiryDate,
    SlaTier? SlaTier,
    SlaComplianceStatus? SlaComplianceStatus,
    DateTime? LastMaintenanceDate
);

public record ShiRecordDto(
    Guid Id,
    Guid SolutionId,
    double ShiScore,
    string RiskTier,
    double LicenceUrgencyScore,
    double VersionGapScore,
    double SlaComplianceScore,
    double MaintenanceRecencyScore,
    double LicenceUrgencyWeight,
    double VersionGapWeight,
    double SlaComplianceWeight,
    double MaintenanceRecencyWeight,
    string? AiBriefing,
    DateTime ComputedAt
);

public record SolutionDto(
    Guid Id,
    Guid ClientId,
    string ClientName,
    string Name,
    string? Description,
    string CurrentVersion,
    string LatestVersion,
    string? LicenceKey,
    DateTime LicenceExpiryDate,
    string SlaTier,
    string SlaComplianceStatus,
    DateTime LastMaintenanceDate,
    bool IsActive,
    ShiRecordDto? LatestShi,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record PagedResult<T>(IEnumerable<T> Items, int TotalCount, int Page, int PageSize);
