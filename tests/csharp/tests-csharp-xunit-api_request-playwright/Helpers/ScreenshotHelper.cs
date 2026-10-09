using Allure.Net.Commons;
using Config;
using Microsoft.Playwright;
using StbImageSharp;
using Xunit.Sdk;

namespace Helpers;

public static class ScreenshotHelper
{
    private static readonly string DiffDir = Path.Combine("screenshot-diff");
    private static readonly byte[] DiffHighlight = { 255, 0, 255, 255 };
    private static readonly byte[] SizeMismatch = { 255, 0, 0, 255 };

    public static void CaptureAndCompare(ILocator element, string area, int viewport, string attachmentName)
    {
        Pw.Run(element.WaitForAsync());
        var actual = Pw.Run(element.ScreenshotAsync(new LocatorScreenshotOptions
        {
            Animations = ScreenshotAnimations.Disabled,
        }));
        var label = area + "/" + viewport;
        var screenshotPath = ScreenshotFilePath(area, viewport);
        var screenshotPresent = ScreenshotExists(area, viewport);

        if (ShouldUpdateScreenshots())
        {
            AllureApi.Step("Update screenshot: " + attachmentName, () =>
            {
                AttachUpdateMode(attachmentName, actual, screenshotPresent, area, viewport);
            });
            WriteScreenshot(screenshotPath, actual);
            return;
        }

        if (!screenshotPresent)
        {
            AllureApi.Step("Missing screenshot: " + attachmentName, () =>
            {
                AttachPng(attachmentName + "-actual-unmatched", actual);
            });
            throw new XunitException(
                $"Screenshot missing for {label}. Commit PNG to {ScreenshotResourcePath(area, viewport)} "
                + "or run with UPDATE_SCREENSHOTS=true");
        }

        var expected = ReadExpectedScreenshot(area, viewport);
        var comparison = CompareImages(expected, actual, label);
        AllureApi.Step("Compare screenshot: " + attachmentName, () =>
        {
            if (comparison.Passed)
            {
                AttachPng(attachmentName, actual);
                return;
            }

            AttachPng(attachmentName + "-expected", expected);
            AttachPng(attachmentName + "-actual", actual);
            AttachPng(attachmentName + "-diff", comparison.DiffPng);
            SaveFailArtifacts(label, actual, comparison.DiffPng);
            throw new XunitException(comparison.Message);
        });
    }

    public static string ScreenshotMode() => ScreenshotMode(ConfigReader.TestConfig.Stand);

    public static string ScreenshotMode(string? env)
    {
        var key = env?.Trim() ?? "";
        return key switch
        {
            "mock" => "mock",
            "stage" => "stage",
            "prod" or "ci" or "" => "prod",
            _ => throw new InvalidOperationException(
                $"screenshot folder: unknown env '{key}' (use mock, stage, prod, or ci)"),
        };
    }

    internal static string ScreenshotOs()
    {
        var overrideOs = Environment.GetEnvironmentVariable("SCREENSHOT_OS");
        var raw = !string.IsNullOrWhiteSpace(overrideOs) ? overrideOs.Trim() : OsFamily();
        return MapScreenshotOs(raw);
    }

    internal static string ScreenshotBrowserFolder() =>
        ScreenshotBrowser() + "-" + ScreenshotBrowserMajor();

    private static void AttachUpdateMode(string attachmentName, byte[] actual, bool screenshotPresent, string area, int viewport)
    {
        if (screenshotPresent)
        {
            AttachPng(attachmentName + "-screenshot-old", ReadExpectedScreenshot(area, viewport));
            AttachPng(attachmentName + "-screenshot-new", actual);
            return;
        }

        AttachPng(attachmentName + "-screenshot-new", actual);
    }

    private static void AttachPng(string name, byte[] png) =>
        AllureApi.AddAttachment(name, "image/png", png, ".png");

    private static bool ShouldUpdateScreenshots() => ConfigReader.TestConfig.UpdateScreenshots;

    private static string ScreenshotsDir()
    {
        var dir = ConfigReader.TestConfig.ScreenshotsDir.Trim();
        if (dir.Length == 0)
        {
            throw new InvalidOperationException("screenshotsDir must not be empty");
        }

        return dir.Replace('\\', '/').TrimEnd('/');
    }

    private static string ScreenshotBrowser()
    {
        var overrideBrowser = Environment.GetEnvironmentVariable("SCREENSHOT_BROWSER");
        return !string.IsNullOrWhiteSpace(overrideBrowser)
            ? overrideBrowser.Trim().ToLowerInvariant()
            : "chrome";
    }

    private static string ScreenshotBrowserMajor() => LocalChromePin.PinnedVersion().Split('.')[0];

    private static string OsFamily()
    {
        if (OperatingSystem.IsMacOS())
        {
            return "darwin";
        }

        if (OperatingSystem.IsWindows())
        {
            return "win32";
        }

        return "linux";
    }

    private static string MapScreenshotOs(string raw)
    {
        var key = raw.ToLowerInvariant();
        if (key is "darwin" or "macos" || key.StartsWith("mac"))
        {
            return "macos";
        }

        if (key is "win32" or "windows" || key.StartsWith("win"))
        {
            return "windows";
        }

        if (key is "linux" || key.Contains("linux"))
        {
            return "linux";
        }

        return key.Length == 0 ? "linux" : key;
    }

    private static string ScreenshotFilePath(string area, int viewport) =>
        Path.Combine(
            Config.ConfigFiles.ModuleDir(),
            ScreenshotsDir(), ScreenshotMode(), ScreenshotOs(), ScreenshotBrowserFolder(),
            area, viewport + ".png");

    private static string ScreenshotResourcePath(string area, int viewport) =>
        $"{ScreenshotsDir()}/{ScreenshotMode()}/{ScreenshotOs()}/{ScreenshotBrowserFolder()}/{area}/{viewport}.png";

    private static bool ScreenshotExists(string area, int viewport)
    {
        var output = Path.Combine(AppContext.BaseDirectory, ScreenshotResourcePath(area, viewport));
        if (File.Exists(output))
        {
            return true;
        }

        return File.Exists(ScreenshotFilePath(area, viewport));
    }

    private static byte[] ReadExpectedScreenshot(string area, int viewport)
    {
        var output = Path.Combine(AppContext.BaseDirectory, ScreenshotResourcePath(area, viewport));
        if (File.Exists(output))
        {
            return File.ReadAllBytes(output);
        }

        var path = ScreenshotFilePath(area, viewport);
        if (File.Exists(path))
        {
            return File.ReadAllBytes(path);
        }

        throw new IOException("Screenshot not found: " + ScreenshotResourcePath(area, viewport));
    }

    private static void WriteScreenshot(string screenshotPath, byte[] png)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(screenshotPath)!);
        File.WriteAllBytes(screenshotPath, png);
    }

    internal sealed record ImageComparison(bool Passed, byte[] DiffPng, string Message);

    internal static ImageComparison CompareImages(byte[] expectedBytes, byte[] actualBytes, string label, double? threshold = null)
    {
        var expected = ImageResult.FromMemory(expectedBytes, ColorComponents.RedGreenBlueAlpha);
        var actual = ImageResult.FromMemory(actualBytes, ColorComponents.RedGreenBlueAlpha);
        var diffPng = CreateDiffPng(expected, actual);

        if (expected.Width != actual.Width || expected.Height != actual.Height)
        {
            return new ImageComparison(
                false,
                diffPng,
                $"Screenshot size changed for {label}: expected {expected.Width}x{expected.Height}, actual {actual.Width}x{actual.Height}");
        }

        var diffPixels = 0;
        var totalPixels = expected.Width * expected.Height;
        for (var offset = 0; offset < expected.Data.Length; offset += 4)
        {
            if (!expected.Data.AsSpan(offset, 4).SequenceEqual(actual.Data.AsSpan(offset, 4)))
            {
                diffPixels++;
            }
        }

        var maxDiffRatio = threshold ?? ConfigReader.TestConfig.ScreenshotDiffThreshold;
        var diffRatio = (double)diffPixels / totalPixels;
        if (diffRatio > maxDiffRatio)
        {
            return new ImageComparison(
                false,
                diffPng,
                $"Screenshot diff too high for {label}: {diffRatio * 100:0.00}% > {maxDiffRatio * 100:0.00}%");
        }

        return new ImageComparison(true, diffPng, "");
    }

    private static byte[] CreateDiffPng(ImageResult expected, ImageResult actual)
    {
        var width = Math.Max(expected.Width, actual.Width);
        var height = Math.Max(expected.Height, actual.Height);
        var diff = new byte[checked(width * height * 4)];
        for (var y = 0; y < height; y++)
        {
            for (var x = 0; x < width; x++)
            {
                var pixel = diff.AsSpan((y * width + x) * 4, 4);
                var inExpected = x < expected.Width && y < expected.Height;
                var inActual = x < actual.Width && y < actual.Height;
                if (inExpected && inActual)
                {
                    var expectedRgba = expected.Data.AsSpan((y * expected.Width + x) * 4, 4);
                    var actualRgba = actual.Data.AsSpan((y * actual.Width + x) * 4, 4);
                    if (expectedRgba.SequenceEqual(actualRgba))
                    {
                        Dim(expectedRgba, pixel);
                    }
                    else
                    {
                        DiffHighlight.AsSpan().CopyTo(pixel);
                    }
                }
                else
                {
                    SizeMismatch.AsSpan().CopyTo(pixel);
                }
            }
        }

        using var ms = new MemoryStream();
        new StbImageWriteSharp.ImageWriter().WritePng(
            diff, width, height, StbImageWriteSharp.ColorComponents.RedGreenBlueAlpha, ms);
        return ms.ToArray();
    }

    private static void Dim(ReadOnlySpan<byte> rgba, Span<byte> pixel)
    {
        var dim = (byte)((rgba[0] + rgba[1] + rgba[2]) / 9);
        pixel[0] = pixel[1] = pixel[2] = dim;
        pixel[3] = 255;
    }

    private static void SaveFailArtifacts(string label, byte[] actual, byte[] diff)
    {
        try
        {
            Directory.CreateDirectory(DiffDir);
            var prefix = label.Replace('/', '_');
            File.WriteAllBytes(Path.Combine(DiffDir, prefix + "-actual.png"), actual);
            File.WriteAllBytes(Path.Combine(DiffDir, prefix + "-diff.png"), diff);
        }
        catch (IOException)
        {
            // CI artifact is best-effort; Allure attachments are primary.
        }
    }
}
