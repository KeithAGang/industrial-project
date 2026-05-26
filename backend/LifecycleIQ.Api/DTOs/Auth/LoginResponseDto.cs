namespace LifecycleIQ.Api.DTOs.Auth;

public record LoginResponseDto(string AccessToken, UserDto User);

public record UserDto(Guid Id, string Email, string FullName, string Role);
