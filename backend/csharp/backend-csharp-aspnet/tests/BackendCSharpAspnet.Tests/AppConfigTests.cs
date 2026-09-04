using Dev.Multistack.App.Config;
using Xunit;

namespace BackendCSharpAspnet.Tests;

[Collection("env")]
public sealed class AppConfigTests
{
    private static void ClearEnv()
    {
        foreach (var key in new[]
                 {
                     "DATABASE_URL", "DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD",
                     "SERVER_PORT", "MANAGEMENT_PORT", "JWT_SECRET", "JWT_EXPIRATION_MS",
                 })
        {
            Environment.SetEnvironmentVariable(key, null);
        }
    }

    [Fact]
    public void LoadDefaults()
    {
        ClearEnv();
        var cfg = AppConfig.Load();
        Assert.Equal("backend-csharp-aspnet", cfg.ServiceName);
        Assert.Equal("8080", cfg.ServerPort);
        Assert.Equal("8081", cfg.ManagementPort);
        Assert.Equal(
            "postgres://multistack:multistack@localhost:5432/multistack_app_csharp_aspnet?sslmode=disable",
            cfg.DatabaseUrl);
        Assert.Equal("multistack-dev-secret-change-in-production-min-32-chars", cfg.JwtSecret);
        Assert.Equal(TimeSpan.FromHours(24), cfg.JwtExpiration);
    }

    [Fact]
    public void LoadFromEnvironment()
    {
        ClearEnv();
        Environment.SetEnvironmentVariable("DB_HOST", "postgres");
        Environment.SetEnvironmentVariable("DB_PORT", "55440");
        Environment.SetEnvironmentVariable("DB_NAME", "other_db");
        Environment.SetEnvironmentVariable("DB_USER", "someone");
        Environment.SetEnvironmentVariable("DB_PASSWORD", "p@ss word");
        Environment.SetEnvironmentVariable("SERVER_PORT", "18860");
        Environment.SetEnvironmentVariable("MANAGEMENT_PORT", "18861");
        Environment.SetEnvironmentVariable("JWT_SECRET", "custom");
        Environment.SetEnvironmentVariable("JWT_EXPIRATION_MS", "1000");
        var cfg = AppConfig.Load();
        Assert.Equal("18860", cfg.ServerPort);
        Assert.Equal("18861", cfg.ManagementPort);
        Assert.Equal("custom", cfg.JwtSecret);
        Assert.Equal(TimeSpan.FromSeconds(1), cfg.JwtExpiration);
        Assert.Equal(
            "postgres://someone:p%40ss%20word@postgres:55440/other_db?sslmode=disable",
            cfg.DatabaseUrl);
    }

    [Fact]
    public void DatabaseUrlOverride()
    {
        ClearEnv();
        Environment.SetEnvironmentVariable("DB_HOST", "ignored");
        Environment.SetEnvironmentVariable("DATABASE_URL", "postgres://u:p@db:5432/explicit");
        Assert.Equal("postgres://u:p@db:5432/explicit", AppConfig.DatabaseUrlFromEnvironment());
    }

    [Theory]
    [InlineData("not-a-number")]
    [InlineData("0")]
    [InlineData("-5")]
    public void JwtExpirationFallsBackOnBadValues(string raw)
    {
        ClearEnv();
        Environment.SetEnvironmentVariable("JWT_EXPIRATION_MS", raw);
        Assert.Equal(TimeSpan.FromHours(24), AppConfig.JwtExpirationFromEnvironment());
    }
}

[CollectionDefinition("env", DisableParallelization = true)]
public sealed class EnvCollection;
