namespace Helpers;

/// <summary>Throwaway test identities. Username fits backend Size(min = 3, max = 64).</summary>
public static class DataFaker
{
    public static string Username() => $"user_{Guid.NewGuid():N}"[..16];

    public static string Password() => "password123";
}
