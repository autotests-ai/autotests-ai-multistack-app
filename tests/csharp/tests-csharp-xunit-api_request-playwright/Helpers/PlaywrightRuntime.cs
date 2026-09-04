using Allure.Net.Commons;
using Config;
using Microsoft.Playwright;
using Pages;

namespace Helpers;

public sealed class PlaywrightRuntime : IDisposable
{
    private const int SessionAttempts = 3;
    private const int SessionRetryDelayMs = 3000;

    private readonly IPlaywright _playwright;
    private readonly IBrowser _browser;
    public readonly IBrowserContext Context;
    public readonly IPage Page;
    public readonly App App;
    private readonly System.Text.StringBuilder _consoleLog = new();
    private readonly string? _hubVideoName;
    private readonly string _videoFolder;
    private readonly bool _attachHubVideo;

    public PlaywrightRuntime(TestConfig config)
    {
        RequireChromium(config);
        Environment.SetEnvironmentVariable("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD", "1");
        _playwright = Pw.Run(Playwright.CreateAsync());
        var parts = config.BrowserSize.Split('x');
        var width = int.Parse(parts[0].Trim());
        var height = int.Parse(parts[1].Trim());
        var remote = SelenoidPlaywrightEndpoint.Resolve(config.RemoteUrl);

        if (SelenoidPlaywrightEndpoint.IsHttpUrl(remote))
        {
            throw new InvalidOperationException(
                "Playwright cannot use Selenoid WebDriver "
                + SelenoidPlaywrightEndpoint.Describe(remote)
                + ". Set SELENOID_PLAYWRIGHT_URL (wss://…/playwright/playwright-chromium/…).");
        }

        var hub = SelenoidPlaywrightEndpoint.IsWebSocket(remote);
        var recordHubVideo = hub && (config.EnableVideo || config.AttachVideo);
        var recordedHubVideoName = recordHubVideo
            ? "autotests-ai-multistack-csharp-pw-" + Guid.NewGuid() + ".mp4"
            : null;

        if (hub)
        {
            var endpoint = SelenoidPlaywrightEndpoint.WithSessionQuery(
                remote,
                config.EnableVnc,
                recordHubVideo,
                recordedHubVideoName,
                ScreenResolution(config));
            _browser = ConnectWithRetry(_playwright, endpoint);
        }
        else
        {
            LocalChromePin.Apply(config.BrowserVersion);
            var launch = new BrowserTypeLaunchOptions
            {
                Headless = config.Headless,
                ExecutablePath = LocalChromePin.ChromeExecutable(),
                Args = config.Headless
                    ? ["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", "--force-device-scale-factor=1"]
                    : ["--force-device-scale-factor=1"],
            };
            _browser = Pw.Run(_playwright.Chromium.LaunchAsync(launch));
        }

        var contextOptions = new BrowserNewContextOptions
        {
            BaseURL = ConfigReader.ResolveBaseUrl(),
            ViewportSize = new ViewportSize { Width = width, Height = height },
            DeviceScaleFactor = 1,
        };

        _hubVideoName = recordedHubVideoName;
        _videoFolder = config.VideoFolder;
        _attachHubVideo = config.AttachVideo && recordedHubVideoName != null;

        Context = Pw.Run(_browser.NewContextAsync(contextOptions));
        Page = Pw.Run(Context.NewPageAsync());
        Page.SetDefaultTimeout(5_000);
        Page.Console += (_, msg) => _consoleLog.Append(msg.Type).Append(' ').Append(msg.Text).Append('\n');
        ViewportHelper.Bind(Page);
        App = new App(Page);
    }

    public string ConsoleText() => _consoleLog.ToString();

    public static void RequireChromium(TestConfig config)
    {
        var browser = (config.Browser ?? "").Trim().ToLowerInvariant();
        if (browser is not "chrome" and not "chromium")
        {
            throw new InvalidOperationException(
                "This Playwright cell is Chromium-only: local Chrome for Testing, "
                + "or Selenoid wss://…/playwright-chromium/…. Got browser="
                + config.Browser);
        }
    }

    private static IBrowser ConnectWithRetry(IPlaywright playwright, string endpoint)
    {
        PlaywrightException? last = null;
        for (var attempt = 1; attempt <= SessionAttempts; attempt++)
        {
            try
            {
                return Pw.Run(playwright.Chromium.ConnectAsync(
                    endpoint, new BrowserTypeConnectOptions { Timeout = 120_000 }));
            }
            catch (PlaywrightException hubRefusedSession)
            {
                last = hubRefusedSession;
                if (attempt == SessionAttempts)
                {
                    break;
                }

                Thread.Sleep(SessionRetryDelayMs);
            }
        }

        throw last!;
    }

    private static string ScreenResolution(TestConfig config)
    {
        var size = config.BrowserSize;
        if (string.IsNullOrWhiteSpace(size))
        {
            return "1920x1080x24";
        }

        var parts = size.Split('x');
        if (parts.Length < 2)
        {
            return "1920x1080x24";
        }

        return parts[0].Trim() + "x" + parts[1].Trim() + "x24";
    }

    public void Dispose()
    {
        try
        {
            Pw.Run(Context.CloseAsync());
        }
        finally
        {
            ViewportHelper.Unbind();
            try
            {
                Pw.Run(_browser.CloseAsync());
            }
            catch (Exception)
            {
                // disconnect after context.close is best-effort
            }

            if (_attachHubVideo && _hubVideoName != null)
            {
                var url = SelenoidPlaywrightEndpoint.VideoUrl(_videoFolder, _hubVideoName);
                if (url.Length > 0)
                {
                    try
                    {
                        AllureApi.AddAttachment("Video", "text/plain", System.Text.Encoding.UTF8.GetBytes(url));
                    }
                    catch (Exception)
                    {
                        // Allure context is optional
                    }
                }
            }

            _playwright.Dispose();
        }
    }
}
