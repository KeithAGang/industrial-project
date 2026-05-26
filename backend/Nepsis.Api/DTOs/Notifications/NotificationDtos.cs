namespace Nepsis.Api.DTOs.Notifications;

public record NotificationDto(
    Guid Id,
    Guid SolutionId,
    string SolutionName,
    string Type,
    string Title,
    string Message,
    bool IsRead,
    DateTime CreatedAt
);

public record NotificationPagedResult(
    IEnumerable<NotificationDto> Items,
    int TotalCount,
    int UnreadCount,
    int Page,
    int PageSize
);
