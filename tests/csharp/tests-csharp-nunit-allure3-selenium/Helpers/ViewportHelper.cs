using Allure.NUnit.Attributes;
using Config;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;

namespace Helpers;

public static class ViewportHelper
{
    [AllureStep("Reset viewport to default browser size")]
    public static void ResetViewport()
    {
        if (!WebDriverHolder.Has)
        {
            return;
        }

        var driver = WebDriverHolder.Get();
        if (!TryCdp(driver, "Emulation.clearDeviceMetricsOverride", new Dictionary<string, object>()))
        {
            driver.Manage().Window.Size = ParseBrowserSize(ConfigReader.TestConfig.BrowserSize);
        }
    }

    public static void SetViewport(int width, int height)
    {
        if (!WebDriverHolder.Has)
        {
            WebDrivers.StartBlank();
        }

        var driver = WebDriverHolder.Get();
        TryCdp(driver, "Emulation.clearDeviceMetricsOverride", new Dictionary<string, object>());
        var metrics = new Dictionary<string, object>
        {
            ["width"] = width,
            ["height"] = height,
            ["deviceScaleFactor"] = 1,
            ["mobile"] = false,
        };
        if (!TryCdp(driver, "Emulation.setDeviceMetricsOverride", metrics))
        {
            driver.Manage().Window.Size = new System.Drawing.Size(width, height);
        }
    }

    private static bool TryCdp(IWebDriver driver, string command, Dictionary<string, object> parameters)
    {
        if (driver is ChromeDriver chrome)
        {
            chrome.ExecuteCdpCommand(command, parameters);
            return true;
        }

        return false;
    }

    private static System.Drawing.Size ParseBrowserSize(string browserSize)
    {
        var parts = browserSize.Split('x');
        if (parts.Length != 2)
        {
            throw new InvalidOperationException("Invalid browserSize: " + browserSize);
        }

        return new System.Drawing.Size(int.Parse(parts[0].Trim()), int.Parse(parts[1].Trim()));
    }
}
