namespace Config;

/// <summary>Java TestConfig analog (UI + in-cell RestSharp).</summary>
public sealed class TestConfig
{
    public string Stand { get; init; } = "prod";
    public string BaseUrl { get; init; } = "";
    public string ApiBaseUrl { get; init; } = "";
    public string ApiHealthService { get; init; } = "backend-java-spring";
    public string WelcomeUsername { get; init; } = "user1";
    public bool EnableAllureRestAssuredListener { get; init; }
    public string Browser { get; init; } = "chrome";
    public string BrowserVersion { get; init; } = "148";
    public string BrowserSize { get; init; } = "1920x1280";
    public bool Headless { get; init; }
    public bool CloseBrowserAfterEach { get; init; } = true;
    public bool CloseBrowserAfterAll { get; init; } = true;
    public bool SkipBlankOpen { get; init; }
    public string RemoteUrl { get; init; } = "";
    public bool EnableVnc { get; init; }
    public bool EnableVideo { get; init; }
    public bool EnableHar { get; init; }
    public string VideoFolder { get; init; } = "";
    public bool AttachBrowserConsoleLogs { get; init; }
    public bool AttachHarLogs { get; init; }
    public bool AttachLastScreenshot { get; init; }
    public bool AttachPageSource { get; init; }
    public bool AttachVideo { get; init; }
    public bool UpdateScreenshots { get; init; }
    public string ScreenshotsDir { get; init; } = "screenshots";
    public double ScreenshotDiffThreshold { get; init; } = 0.015;
}
