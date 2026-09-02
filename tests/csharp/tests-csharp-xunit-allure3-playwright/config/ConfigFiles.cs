namespace Config;

/// <summary>
/// Owner analog: merge <c>config/default.properties</c> + <c>config/${stand}.properties</c>,
/// then env overrides. Not in the Coverlet include — Java loads this via aeonbits Owner.
/// </summary>
internal static class ConfigFiles
{
    public static TestConfig Load()
    {
        var stand = ResolveStand();
        var values = LoadProperties("default");
        Merge(values, LoadProperties(stand));
        var welcomeDefault = stand == "mock" ? "mock-user" : "user1";
        return new TestConfig
        {
            Stand = stand,
            BaseUrl = FirstNonEmpty(Environment.GetEnvironmentVariable("BASE_URL"), Get(values, "baseUrl")),
            ApiBaseUrl = FirstNonEmpty(Environment.GetEnvironmentVariable("API_BASE_URL"), Get(values, "apiBaseUrl")),
            ApiHealthService = FirstNonEmpty(
                Environment.GetEnvironmentVariable("API_HEALTH_SERVICE"),
                Get(values, "apiHealthService"),
                "backend-java-spring"),
            WelcomeUsername = FirstNonEmpty(
                Environment.GetEnvironmentVariable("WELCOME_USERNAME"),
                Get(values, "welcomeUsername"),
                welcomeDefault),
            EnableAllureRestAssuredListener = ParseBool(
                FirstNonEmpty(Environment.GetEnvironmentVariable("ENABLE_ALLURE_REST_LISTENER"), Get(values, "enableAllureRestAssuredListener"))),
            Browser = FirstNonEmpty(Environment.GetEnvironmentVariable("BROWSER"), Get(values, "browser"), "chrome"),
            BrowserVersion = FirstNonEmpty(
                Environment.GetEnvironmentVariable("BROWSER_VERSION"),
                Get(values, "browserVersion"),
                "148"),
            BrowserSize = FirstNonEmpty(
                Environment.GetEnvironmentVariable("BROWSER_SIZE"),
                Get(values, "browserSize"),
                "1920x1280"),
            Headless = ParseBool(FirstNonEmpty(Environment.GetEnvironmentVariable("HEADLESS"), Get(values, "headless"))),
            CloseBrowserAfterEach = ParseBool(
                FirstNonEmpty(Environment.GetEnvironmentVariable("CLOSE_BROWSER_AFTER_EACH"), Get(values, "closeBrowserAfterEach"), "true"),
                defaultValue: true),
            CloseBrowserAfterAll = ParseBool(
                FirstNonEmpty(Environment.GetEnvironmentVariable("CLOSE_BROWSER_AFTER_ALL"), Get(values, "closeBrowserAfterAll"), "true"),
                defaultValue: true),
            SkipBlankOpen = ParseBool(FirstNonEmpty(Environment.GetEnvironmentVariable("SKIP_BLANK_OPEN"), Get(values, "skipBlankOpen"))),
            RemoteUrl = FirstNonEmpty(
                Environment.GetEnvironmentVariable("SELENOID_PLAYWRIGHT_URL"),
                Environment.GetEnvironmentVariable("REMOTE_URL"),
                Get(values, "remoteUrl")),
            EnableVnc = ParseBool(FirstNonEmpty(Environment.GetEnvironmentVariable("ENABLE_VNC"), Get(values, "enableVnc"))),
            EnableVideo = ParseBool(FirstNonEmpty(Environment.GetEnvironmentVariable("ENABLE_VIDEO"), Get(values, "enableVideo"))),
            EnableHar = ParseBool(FirstNonEmpty(Environment.GetEnvironmentVariable("ENABLE_HAR"), Get(values, "enableHar"))),
            VideoFolder = FirstNonEmpty(Environment.GetEnvironmentVariable("VIDEO_FOLDER"), Get(values, "videoFolder")),
            AttachBrowserConsoleLogs = ParseBool(
                FirstNonEmpty(Environment.GetEnvironmentVariable("ATTACH_BROWSER_CONSOLE_LOGS"), Get(values, "attachBrowserConsoleLogs"))),
            AttachHarLogs = ParseBool(FirstNonEmpty(Environment.GetEnvironmentVariable("ATTACH_HAR_LOGS"), Get(values, "attachHarLogs"))),
            AttachLastScreenshot = ParseBool(
                FirstNonEmpty(Environment.GetEnvironmentVariable("ATTACH_LAST_SCREENSHOT"), Get(values, "attachLastScreenshot"))),
            AttachPageSource = ParseBool(
                FirstNonEmpty(Environment.GetEnvironmentVariable("ATTACH_PAGE_SOURCE"), Get(values, "attachPageSource"))),
            AttachVideo = ParseBool(FirstNonEmpty(Environment.GetEnvironmentVariable("ATTACH_VIDEO"), Get(values, "attachVideo"))),
            UpdateScreenshots = ParseBool(
                FirstNonEmpty(Environment.GetEnvironmentVariable("UPDATE_SCREENSHOTS"), Get(values, "updateScreenshots"))),
            ScreenshotsDir = FirstNonEmpty(
                Environment.GetEnvironmentVariable("SCREENSHOTS_DIR"),
                Get(values, "screenshotsDir"),
                "screenshots"),
            ScreenshotDiffThreshold = ParseDouble(
                FirstNonEmpty(Environment.GetEnvironmentVariable("SCREENSHOT_DIFF_THRESHOLD"), Get(values, "screenshotDiffThreshold")),
                0.015),
        };
    }

    private static string ResolveStand()
    {
        var raw = FirstNonEmpty(
            Environment.GetEnvironmentVariable("STAND"),
            Environment.GetEnvironmentVariable("ENV"),
            "prod").ToLowerInvariant();
        return raw is "prod" or "stage" or "mock" or "ci" ? raw : "prod";
    }

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

    private static bool ParseBool(string raw, bool defaultValue = false)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return defaultValue;
        }

        return string.Equals(raw, "true", StringComparison.OrdinalIgnoreCase)
            || raw == "1"
            || string.Equals(raw, "yes", StringComparison.OrdinalIgnoreCase)
            || string.Equals(raw, "on", StringComparison.OrdinalIgnoreCase);
    }

    private static double ParseDouble(string raw, double fallback) =>
        double.TryParse(raw, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var value)
            ? value
            : fallback;

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

    internal static string ConfigDir()
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

    internal static string ModuleDir()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "tests-csharp-xunit-allure3-playwright.csproj")))
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        var config = new DirectoryInfo(ConfigDir());
        return config.Parent?.FullName ?? AppContext.BaseDirectory;
    }
}
