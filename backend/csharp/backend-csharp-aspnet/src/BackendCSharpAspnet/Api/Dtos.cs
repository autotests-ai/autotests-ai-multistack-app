using System.Text.Json.Serialization;

namespace Dev.Multistack.App.Api;

// Response bodies are types rather than dictionaries so the JSON field order matches
// the other reference backends exactly.

public sealed class HealthResponse
{
    [JsonPropertyOrder(0)]
    public required string Status { get; init; }

    [JsonPropertyOrder(1)]
    public required string Service { get; init; }
}

public sealed class ItemDto
{
    [JsonPropertyOrder(0)]
    public required long Id { get; init; }

    [JsonPropertyOrder(1)]
    public required string Name { get; init; }

    [JsonPropertyOrder(2)]
    public required string Description { get; init; }
}

public sealed class ItemsResponse
{
    [JsonPropertyOrder(0)]
    public required List<ItemDto> Items { get; init; }

    [JsonPropertyOrder(1)]
    public required string Source { get; init; }
}

public sealed class AuthResponse
{
    [JsonPropertyOrder(0)]
    public required string Token { get; init; }

    [JsonPropertyOrder(1)]
    public required string Username { get; init; }

    [JsonPropertyOrder(2)]
    public required string RedirectUrl { get; init; }
}

public sealed class ProfileResponse
{
    [JsonPropertyOrder(0)]
    public required string Username { get; init; }
}

public sealed class ErrorResponse
{
    [JsonPropertyOrder(0)]
    public required string Message { get; init; }
}
