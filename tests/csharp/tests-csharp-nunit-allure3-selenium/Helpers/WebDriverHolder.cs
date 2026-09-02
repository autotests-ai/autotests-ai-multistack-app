using OpenQA.Selenium;

namespace Helpers;

public static class WebDriverHolder
{
    [ThreadStatic]
    private static IWebDriver? _driver;

    public static void Set(IWebDriver driver) => _driver = driver;

    public static IWebDriver Get() =>
        _driver ?? throw new InvalidOperationException("WebDriver is not started");

    public static bool Has => _driver != null;

    public static void Quit()
    {
        if (_driver == null)
        {
            return;
        }

        try
        {
            _driver.Quit();
        }
        finally
        {
            _driver = null;
        }
    }
}
