namespace Dev.Multistack.App.Config;

/// <summary>
/// Runtime settings from the same environment variables the other reference backends read.
/// </summary>
public sealed record AppConfig(
    string ServiceName,
    string ServerPort,
    string ManagementPort,
    string DatabaseUrl,
    string JwtSecret,
    TimeSpan JwtExpiration)
{
    public const string ServiceNameValue = "backend-csharp-aspnet";
    public const string PostAuthRedirect = "/";

    public const string DefaultDatabaseName = "multistack_app_csharp_aspnet";
    public const string DefaultServerPort = "8080";
    public const string DefaultManagementPort = "8081";
    public const string DefaultJwtSecret = "multistack-dev-secret-change-in-production-min-32-chars";
    public const long DefaultExpirationMs = 86_400_000;

    public static AppConfig Load() => new(
        ServiceNameValue,
        Env("SERVER_PORT", DefaultServerPort),
        Env("MANAGEMENT_PORT", DefaultManagementPort),
        DatabaseUrlFromEnvironment(),
        Env("JWT_SECRET", DefaultJwtSecret),
        JwtExpirationFromEnvironment());

    public static string DatabaseUrlFromEnvironment()
    {
        var explicitUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (!string.IsNullOrEmpty(explicitUrl))
        {
            return explicitUrl;
        }

        var user = Uri.EscapeDataString(Env("DB_USER", "multistack"));
        var password = Uri.EscapeDataString(Env("DB_PASSWORD", "multistack"));
        var host = Env("DB_HOST", "localhost");
        var port = Env("DB_PORT", "5432");
        var name = Env("DB_NAME", DefaultDatabaseName);
        return $"postgres://{user}:{password}@{host}:{port}/{name}?sslmode=disable";
    }

    public static TimeSpan JwtExpirationFromEnvironment()
    {
        var ms = DefaultExpirationMs;
        var raw = Environment.GetEnvironmentVariable("JWT_EXPIRATION_MS");
        if (!string.IsNullOrEmpty(raw) && long.TryParse(raw, out var parsed) && parsed > 0)
        {
            ms = parsed;
        }

        return TimeSpan.FromMilliseconds(ms);
    }

    private static string Env(string key, string fallback)
    {
        var value = Environment.GetEnvironmentVariable(key);
        return string.IsNullOrEmpty(value) ? fallback : value;
    }
}
