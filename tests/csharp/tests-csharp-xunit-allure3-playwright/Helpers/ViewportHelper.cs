using Allure.Net.Commons.Attributes;
using Config;
using Microsoft.Playwright;

namespace Helpers;

public static class ViewportHelper
{
    [ThreadStatic]
    private static IPage? _page;

    public static void Bind(IPage page) => _page = page;

    public static void Unbind() => _page = null;

    public static IPage Page =>
        _page ?? throw new InvalidOperationException("ViewportHelper.Bind() was not called for this thread");

    [AllureStep("Reset viewport to default browser size")]
    public static void ResetViewport()
    {
        if (_page == null)
        {
            return;
        }

        var size = ParseBrowserSize(ConfigReader.TestConfig.BrowserSize);
        Pw.Run(_page.SetViewportSizeAsync(size.Width, size.Height));
    }

    public static void SetViewport(int width, int height) =>
        Pw.Run(Page.SetViewportSizeAsync(width, height));

    private static (int Width, int Height) ParseBrowserSize(string browserSize)
    {
        var parts = browserSize.Split('x');
        if (parts.Length != 2)
        {
            throw new InvalidOperationException("Invalid browserSize: " + browserSize);
        }

        return (int.Parse(parts[0].Trim()), int.Parse(parts[1].Trim()));
    }
}
