namespace Config;

/// <summary>
/// Owner-file analog: merge <c>config/default.properties</c> + <c>config/${env}.properties</c>,
/// then <c>STAND</c>/<c>ENV</c>/<c>BASE_URL</c>/<c>API_BASE_URL</c>.
/// </summary>
public sealed class ConfigReader
{
    private ConfigReader()
    {
    }

    public static TestConfig TestConfig => LoadConfig();

    public static string ResolveBaseUrl() => ResolveBaseUrl(LoadConfig());

    public static string ResolveBaseUrl(TestConfig config)
    {
        var url = config.BaseUrl.Trim();
        if (url.Length > 0)
        {
            return WithSlash(url);
        }

        throw new InvalidOperationException("Set baseUrl in config/${env}.properties");
    }

    public static string ResolveApiBaseUrl() => ResolveApiBaseUrl(LoadConfig());

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

    public static TestConfig LoadConfig()
    {
        var stand = ResolveStand();
        var values = LoadProperties("default");
        Merge(values, LoadProperties(stand));
        var baseUrl = FirstNonEmpty(Environment.GetEnvironmentVariable("BASE_URL"), Get(values, "baseUrl"));
        var api = FirstNonEmpty(Environment.GetEnvironmentVariable("API_BASE_URL"), Get(values, "apiBaseUrl"));
        return new TestConfig
        {
            Stand = stand,
            BaseUrl = baseUrl,
            ApiBaseUrl = api,
            ApiHealthService = FirstNonEmpty(
                Environment.GetEnvironmentVariable("API_HEALTH_SERVICE"),
                Get(values, "apiHealthService"),
                "backend-java-spring"),
            EnableAllureRestAssuredListener = ParseBool(Get(values, "enableAllureRestAssuredListener")),
        };
    }

    public static TestConfig ConfigWith(IReadOnlyDictionary<string, string> overrides) =>
        new()
        {
            BaseUrl = overrides.GetValueOrDefault("baseUrl", ""),
            ApiBaseUrl = overrides.GetValueOrDefault("apiBaseUrl", ""),
            ApiHealthService = overrides.GetValueOrDefault("apiHealthService", "backend-java-spring"),
        };

    private static string ResolveStand()
    {
        var raw = FirstNonEmpty(
            Environment.GetEnvironmentVariable("STAND"),
            Environment.GetEnvironmentVariable("ENV"),
            "prod").ToLowerInvariant();
        return raw is "prod" or "stage" or "mock" or "ci" ? raw : "prod";
    }

    private static string WithSlash(string s) => s.EndsWith('/') ? s : s + "/";

    private static string FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return "";
    }

    private static string Get(Dictionary<string, string> values, string key) =>
        values.GetValueOrDefault(key, "");

    private static bool ParseBool(string raw) =>
        string.Equals(raw, "true", StringComparison.OrdinalIgnoreCase);

    private static void Merge(Dictionary<string, string> target, Dictionary<string, string> extra)
    {
        foreach (var (key, value) in extra)
        {
            target[key] = value;
        }
    }

    private static Dictionary<string, string> LoadProperties(string stand)
    {
        var path = Path.Combine(ConfigDir(), $"{stand}.properties");
        var result = new Dictionary<string, string>(StringComparer.Ordinal);
        if (!File.Exists(path))
        {
            return result;
        }

        foreach (var line in File.ReadAllLines(path))
        {
            var trimmed = line.Trim();
            if (trimmed.Length == 0 || trimmed.StartsWith('#'))
            {
                continue;
            }

            var eq = trimmed.IndexOf('=');
            if (eq <= 0)
            {
                continue;
            }

            result[trimmed[..eq].Trim()] = trimmed[(eq + 1)..].Trim();
        }

        return result;
    }

    private static string ConfigDir()
    {
        var fromOutput = Path.Combine(AppContext.BaseDirectory, "config");
        if (Directory.Exists(fromOutput))
        {
            return fromOutput;
        }

        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            var candidate = Path.Combine(dir.FullName, "config");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            dir = dir.Parent;
        }

        return fromOutput;
    }
}
