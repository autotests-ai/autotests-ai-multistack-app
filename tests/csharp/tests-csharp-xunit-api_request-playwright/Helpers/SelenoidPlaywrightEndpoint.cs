namespace Helpers;

/// <summary>
/// Selenoid Playwright is a WebSocket (<c>wss://…/playwright/playwright-chromium/…</c>),
/// not WebDriver <c>/wd/hub</c>. Query may contain <c>accessKey</c> — never log it.
/// </summary>
public static class SelenoidPlaywrightEndpoint
{
    /// <summary>
    /// Prefer <c>SELENOID_PLAYWRIGHT_URL</c> (Jenkins/GHA env keeps <c>?accessKey=</c>).
    /// <c>REMOTE_URL=wss://…?accessKey=</c> is easy to truncate before the test host.
    /// </summary>
    public static string Resolve(string configRemoteUrl) =>
        PreferWebSocket(Environment.GetEnvironmentVariable("SELENOID_PLAYWRIGHT_URL"), configRemoteUrl);

    public static string PreferWebSocket(string? envUrl, string? configUrl)
    {
        var env = envUrl?.Trim() ?? "";
        if (IsWebSocket(env))
        {
            return env;
        }

        return configUrl?.Trim() ?? "";
    }

    public static bool IsWebSocket(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return false;
        }

        var u = url.Trim().ToLowerInvariant();
        return u.StartsWith("ws://") || u.StartsWith("wss://");
    }

    public static bool IsHttpUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return false;
        }

        var u = url.Trim().ToLowerInvariant();
        return u.StartsWith("http://") || u.StartsWith("https://");
    }

    /// <summary>Scheme + host + path only.</summary>
    public static string Describe(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return "";
        }

        try
        {
            var uri = new Uri(url.Trim());
            return uri.Scheme + "://" + uri.Host + uri.AbsolutePath;
        }
        catch (UriFormatException)
        {
            return "(unparseable remoteUrl)";
        }
    }

    public static string WithSessionQuery(string ws, bool enableVnc, bool enableVideo) =>
        WithSessionQuery(ws, enableVnc, enableVideo, null, null);

    /// <summary>
    /// Playwright has no WebDriver session id. When the hub records video, pass a unique
    /// <c>videoName</c> so Allure can link <c>videoFolder/videoName</c> the same way
    /// the Java/TypeScript Playwright cells do.
    /// </summary>
    public static string WithSessionQuery(
        string ws,
        bool enableVnc,
        bool enableVideo,
        string? videoName,
        string? screenResolution)
    {
        var extra = new Dictionary<string, string>
        {
            ["name"] = "autotests-ai-multistack-csharp-pw",
            ["sessionTimeout"] = "5m",
            ["enableVNC"] = enableVnc ? "true" : "false",
            ["enableVideo"] = enableVideo ? "true" : "false",
        };
        if (enableVideo)
        {
            if (!string.IsNullOrWhiteSpace(videoName))
            {
                extra["videoName"] = videoName.Trim();
            }

            if (!string.IsNullOrWhiteSpace(screenResolution))
            {
                extra["screenResolution"] = screenResolution.Trim();
            }
        }

        var encoded = string.Join("&", extra.Select(e => Enc(e.Key) + "=" + Enc(e.Value)));
        var baseWs = ws.Trim();
        return baseWs.Contains('?') ? baseWs + "&" + encoded : baseWs + "?" + encoded;
    }

    /// <summary>Public Selenoid video URL: <c>https://selenoid.qa.guru/video/file.mp4</c>.</summary>
    public static string VideoUrl(string? folder, string? fileName)
    {
        if (string.IsNullOrWhiteSpace(folder) || string.IsNullOrWhiteSpace(fileName))
        {
            return "";
        }

        var baseFolder = folder.Trim();
        if (!baseFolder.EndsWith('/'))
        {
            baseFolder += "/";
        }

        return baseFolder + fileName.Trim();
    }

    private static string Enc(string s) => Uri.EscapeDataString(s);
}
