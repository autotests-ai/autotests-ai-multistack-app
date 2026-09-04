namespace Config;

/// <summary>Java ConfigReader analog (HTTP-only: baseUrl + apiBaseUrl). Owner file merge lives in <see cref="ConfigFiles"/>.</summary>
public sealed class ConfigReader
{
    private ConfigReader()
    {
    }

    public static TestConfig TestConfig => LoadConfig();

    public static string ResolveBaseUrl() => ResolveBaseUrl(TestConfig);

    public static string ResolveBaseUrl(TestConfig config)
    {
        var url = config.BaseUrl.Trim();
        if (url.Length > 0)
        {
            return WithSlash(url);
        }

        throw new InvalidOperationException("Set baseUrl in config/${env}.properties");
    }

    public static string ResolveApiBaseUrl() => ResolveApiBaseUrl(TestConfig);

    public static string ResolveApiBaseUrl(TestConfig config)
    {
        var apiUrl = config.ApiBaseUrl.Trim();
        if (apiUrl.Length > 0)
        {
            return WithSlash(apiUrl);
        }

        throw new InvalidOperationException("Set apiBaseUrl in config/${env}.properties");
    }

    /// <summary>Java private constructor analog — ConfigReaderTest reaches the closed helper.</summary>
    public static ConfigReader ClosedConfigReader() => new();

    public static TestConfig LoadConfig() => ConfigFiles.Load();

    public static TestConfig ConfigWith(IReadOnlyDictionary<string, string> overrides) =>
        new()
        {
            BaseUrl = overrides.GetValueOrDefault("baseUrl", ""),
            ApiBaseUrl = overrides.GetValueOrDefault("apiBaseUrl", ""),
            ApiHealthService = overrides.GetValueOrDefault("apiHealthService", "backend-java-spring"),
        };

    private static string WithSlash(string s) => s.EndsWith('/') ? s : s + "/";
}
