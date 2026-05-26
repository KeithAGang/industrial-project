using Nepsis.Api.DTOs.Solutions;

namespace Nepsis.Api.DTOs.Dashboard;

public record DashboardStatsDto(
    int TotalSolutions,
    int CriticalCount,
    int HighCount,
    int MediumCount,
    int LowCount,
    double AverageShi,
    IEnumerable<SolutionDto> TopRiskSolutions
);
