using Config;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Remote;

namespace Helpers;

public static class WebDrivers
{
    private const int SessionAttempts = 3;
    private const int SessionRetryDelayMs = 3000;

    public static void StartBlank()
    {
        if (WebDriverHolder.Has)
        {
            return;
        }

        Start();
        WebDriverHolder.Get().Navigate().GoToUrl("about:blank");
    }

    public static void EnsureSession()
    {
        if (WebDriverHolder.Has)
        {
            return;
        }

        for (var attempt = 1; ; attempt++)
        {
            try
            {
                Start();
                WebDriverHolder.Get().Navigate().GoToUrl(ConfigReader.ResolveBaseUrl());
                return;
            }
            catch (WebDriverException hubRefusedSession) when (IsSessionCreateFailure(hubRefusedSession))
            {
                WebDriverHolder.Quit();
                if (attempt >= SessionAttempts)
                {
                    throw;
                }

                Thread.Sleep(SessionRetryDelayMs);
            }
        }
    }

    public static void Start()
    {
        if (WebDriverHolder.Has)
        {
            return;
        }

        var config = ConfigReader.TestConfig;
        var driver = Create(config);
        ApplyWindowSize(driver, config);
        WebDriverHolder.Set(driver);
    }

    public static void RequireChrome(TestConfig config)
    {
        var browser = (config.Browser ?? "").Trim().ToLowerInvariant();
        if (browser is not "chrome" and not "chromium")
        {
            throw new InvalidOperationException(
                "This Selenium cell is Chrome-only: local Chrome for Testing, "
                + "or Selenoid chrome. Got browser=" + config.Browser);
        }
    }

    private static IWebDriver Create(TestConfig config)
    {
        RequireChrome(config);
        var remote = config.RemoteUrl.Trim();
        var options = ChromeOptionsFor(config, local: remote.Length == 0);
        if (remote.Length > 0)
        {
            return new RemoteWebDriver(new Uri(remote), options);
        }

        var pin = LocalChromePin.Resolve(config.BrowserVersion);
        options.BinaryLocation = pin.Chrome;
        var service = ChromeDriverService.CreateDefaultService(Path.GetDirectoryName(pin.Driver)!);
        return new ChromeDriver(service, options);
    }

    private static ChromeOptions ChromeOptionsFor(TestConfig config, bool local)
    {
        var options = new ChromeOptions();
        if (config.Headless)
        {
            options.AddArguments("--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage");
        }
        else if (local)
        {
            options.AddArguments("--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage");
        }

        if (!local)
        {
            options.BrowserVersion = config.BrowserVersion;
            options.AddAdditionalOption("selenoid:options", new Dictionary<string, object>
            {
                ["enableVNC"] = config.EnableVnc,
                ["enableVideo"] = config.EnableVideo,
            });
        }

        return options;
    }

    private static void ApplyWindowSize(IWebDriver driver, TestConfig config)
    {
        var parts = config.BrowserSize.Split('x');
        if (parts.Length != 2)
        {
            return;
        }

        driver.Manage().Window.Size = new System.Drawing.Size(
            int.Parse(parts[0].Trim()),
            int.Parse(parts[1].Trim()));
        driver.Manage().Timeouts().ImplicitWait = TimeSpan.Zero;
    }

    private static bool IsSessionCreateFailure(WebDriverException error) =>
        error.Message.Contains("session", StringComparison.OrdinalIgnoreCase)
        || error.Message.Contains("chrome not reachable", StringComparison.OrdinalIgnoreCase);
}
