using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Helpers;
using StbImageSharp;
using Tests;

namespace Tests.Infra;

[AllureLabel("layer", "infra")]
[AllureEpic("Test infra")]
[AllureFeature("ScreenshotHelper")]
[AllureSeverity(SeverityLevel.normal)]
[Trait("TestCategory", "infra")]
[Trait("TestCategory", "infra_backend")]
[AllureSuite("ScreenshotHelper")]
public sealed class ScreenshotHelperTest : AllureMeta
{
    private const string ExpectedPng = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGklEQVR4nGOIspH7fyLFqIGBlV+SQc4m6j8AM4QFci1pcqMAAAAASUVORK5CYII=";
    private const string RedChangedPng = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGklEQVR4nGOItpH7fyLFqIGBlV+SQc4m6j8AM5UFcxsrGHIAAAAASUVORK5CYII=";
    private const string GreenChangedPng = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGklEQVR4nGOIspX7fyLFqIGBlV+SQc4m6j8AM5QFc1Sx5f4AAAAASUVORK5CYII=";
    private const string BlueChangedPng = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGklEQVR4nGOIspH/fyLFqIGBlV+SQc4m6j8AM5MFcw3qHJkAAAAASUVORK5CYII=";
    private const string AlphaChangedPng = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGklEQVR4nGOIspH7dyLFqIGBlV+SQc4m6j8AM3YFcQuBmSIAAAAASUVORK5CYII=";
    private const string TransparentColorChangedPng = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGklEQVR4nGOIspH7fyLFqIGBjV+SQc4m6j8AM4wFc7p5ZjoAAAAASUVORK5CYII=";
    private const string TransparentAlphaChangedPng = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGklEQVR4nGOIspH7fyLFqIGBlV+SUc4m6j8AM4kFc3UYUI4AAAAASUVORK5CYII=";
    private const string NarrowPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVR4nGOIspH7z3AixagBABEQA5KrE2CIAAAAAElFTkSuQmCC";
    private const string ShortPng = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAEUlEQVR4nGOIspH7fyLFqAEAD1wDkrmkxxwAAAAASUVORK5CYII=";
    private const string AllChangedPng = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEElEQVR4nGNgYGD4D8UQBgAd9AP9yOH2qAAAAABJRU5ErkJggg==";
    private static readonly byte[] DimPixels =
    {
        20, 20, 20, 255, 38, 38, 38, 255,
        5, 5, 5, 255, 20, 20, 20, 255,
    };

    [InlineData("mock", "mock")]
    [InlineData("stage", "stage")]
    [InlineData("prod", "prod")]
    [InlineData("ci", "prod")]
    [InlineData("", "prod")]
    [Theory(DisplayName = "screenshotMode maps env to a stand folder")]
    public void ScreenshotModeMapsEnvToStandFolder(string env, string folder)
    {
        Assert.Equal(folder, ScreenshotHelper.ScreenshotMode(env));
    }

    [InlineData("dev")]
    [InlineData("local")]
    [InlineData("multistack_ci")]
    [Theory(DisplayName = "screenshotMode rejects unknown env")]
    public void ScreenshotModeRejectsUnknownEnv(string env)
    {
        var error = Assert.Throws<InvalidOperationException>(() => ScreenshotHelper.ScreenshotMode(env));
        Assert.Contains("unknown env", error!.Message);
    }

    [Fact(DisplayName = "Identical RGBA PNGs pass and produce opaque dim pixels")]
    public void IdenticalPngsProduceDimDiff()
    {
        var result = Compare(ExpectedPng, ExpectedPng, 0);
        Assert.True(result.Passed);
        Assert.Equal("", result.Message);
        AssertDiff(result.DiffPng, DimPixels);
    }

    [InlineData(RedChangedPng, 0)]
    [InlineData(GreenChangedPng, 0)]
    [InlineData(BlueChangedPng, 0)]
    [InlineData(AlphaChangedPng, 0)]
    [InlineData(TransparentColorChangedPng, 2)]
    [InlineData(TransparentAlphaChangedPng, 2)]
    [Theory(DisplayName = "Every RGBA channel is compared exactly, including transparent pixels")]
    public void ChangedRgbaPixelProducesMagentaDiff(string actual, int pixel)
    {
        var result = Compare(ExpectedPng, actual, 0);
        Assert.False(result.Passed);
        Assert.Equal($"Screenshot diff too high for fixture: {25d:0.00}% > {0d:0.00}%", result.Message);
        var pixels = (byte[])DimPixels.Clone();
        new byte[] { 255, 0, 255, 255 }.CopyTo(pixels, pixel * 4);
        AssertDiff(result.DiffPng, pixels);
    }

    [InlineData(NarrowPng, 1, 2, false)]
    [InlineData(NarrowPng, 1, 2, true)]
    [InlineData(ShortPng, 2, 1, false)]
    [InlineData(ShortPng, 2, 1, true)]
    [Theory(DisplayName = "Width and height mismatches fail regardless of threshold and produce red pixels")]
    public void DifferentSizesProduceRedDiff(string resized, int width, int height, bool reverse)
    {
        var result = reverse ? Compare(resized, ExpectedPng, 1) : Compare(ExpectedPng, resized, 1);
        Assert.False(result.Passed);
        var expectedSize = reverse ? $"{width}x{height}" : "2x2";
        var actualSize = reverse ? "2x2" : $"{width}x{height}";
        Assert.Equal($"Screenshot size changed for fixture: expected {expectedSize}, actual {actualSize}", result.Message);
        var pixels = width == 1
            ? new byte[] { 20, 20, 20, 255, 255, 0, 0, 255, 255, 0, 255, 255, 255, 0, 0, 255 }
            : new byte[] { 20, 20, 20, 255, 38, 38, 38, 255, 255, 0, 0, 255, 255, 0, 0, 255 };
        AssertDiff(result.DiffPng, pixels);
    }

    [InlineData(false)]
    [InlineData(true)]
    [Theory(DisplayName = "Diff canvas uses both maximum dimensions, including pixels outside both images")]
    public void CrossedDimensionsProduceRedDiff(bool reverse)
    {
        var result = reverse ? Compare(NarrowPng, ShortPng, 1) : Compare(ShortPng, NarrowPng, 1);
        Assert.False(result.Passed);
        AssertDiff(result.DiffPng, new byte[]
        {
            20, 20, 20, 255, 255, 0, 0, 255,
            255, 0, 0, 255, 255, 0, 0, 255,
        });
    }

    [InlineData(0, false)]
    [InlineData(0.24, false)]
    [InlineData(0.25, true)]
    [InlineData(0.26, true)]
    [Theory(DisplayName = "A diff equal to the threshold passes; a larger diff fails")]
    public void ComparisonHonorsThreshold(double threshold, bool passed)
    {
        var result = Compare(ExpectedPng, AlphaChangedPng, threshold);
        Assert.Equal(passed, result.Passed);
        Assert.Equal(passed ? "" : $"Screenshot diff too high for fixture: {25d:0.00}% > {threshold * 100:0.00}%", result.Message);
    }

    [InlineData(0.99, false)]
    [InlineData(1, true)]
    [Theory(DisplayName = "The threshold uses changed pixels over the full image area")]
    public void AllChangedPixelsHonorThreshold(double threshold, bool passed)
    {
        var result = Compare(ExpectedPng, AllChangedPng, threshold);
        Assert.Equal(passed, result.Passed);
        AssertDiff(result.DiffPng, new byte[]
        {
            255, 0, 255, 255, 255, 0, 255, 255,
            255, 0, 255, 255, 255, 0, 255, 255,
        });
    }

    [Fact(DisplayName = "Screenshot comparison defaults to screenshotDiffThreshold from config")]
    public void ComparisonUsesConfiguredThreshold()
    {
        var configured = ScreenshotHelper.CompareImages(Convert.FromBase64String(ExpectedPng), Convert.FromBase64String(AlphaChangedPng), "fixture");
        var explicitThreshold = Compare(ExpectedPng, AlphaChangedPng, Config.ConfigReader.TestConfig.ScreenshotDiffThreshold);
        Assert.Equal(explicitThreshold.Passed, configured.Passed);
        Assert.Equal(explicitThreshold.Message, configured.Message);
    }

    private static ScreenshotHelper.ImageComparison Compare(string expected, string actual, double threshold) =>
        ScreenshotHelper.CompareImages(Convert.FromBase64String(expected), Convert.FromBase64String(actual), "fixture", threshold);

    private static void AssertDiff(byte[] png, byte[] pixels)
    {
        var image = ImageResult.FromMemory(png, ColorComponents.RedGreenBlueAlpha);
        Assert.Equal(2, image.Width);
        Assert.Equal(2, image.Height);
        Assert.Equal(pixels, image.Data);
    }
}
