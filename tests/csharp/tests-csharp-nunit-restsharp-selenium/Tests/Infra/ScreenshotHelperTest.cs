using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Helpers;
using StbImageSharp;
using Tests;

namespace Tests.Infra;

[AllureLabel("layer", "infra")]
[AllureEpic("Test infra")]
[AllureFeature("ScreenshotHelper")]
[AllureSeverity(SeverityLevel.normal)]
[Category("infra")]
[Category("infra_backend")]
[AllureSuite("ScreenshotHelper")]
[NonParallelizable]
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

    [TestCase("mock", "mock")]
    [TestCase("stage", "stage")]
    [TestCase("prod", "prod")]
    [TestCase("ci", "prod")]
    [TestCase("", "prod")]
    [AllureName("screenshotMode maps env to a stand folder")]
    public void ScreenshotModeMapsEnvToStandFolder(string env, string folder)
    {
        Assert.That(ScreenshotHelper.ScreenshotMode(env), Is.EqualTo(folder));
    }

    [TestCase("dev")]
    [TestCase("local")]
    [TestCase("multistack_ci")]
    [AllureName("screenshotMode rejects unknown env")]
    public void ScreenshotModeRejectsUnknownEnv(string env)
    {
        var error = Assert.Throws<InvalidOperationException>(() => ScreenshotHelper.ScreenshotMode(env));
        Assert.That(error!.Message, Does.Contain("unknown env"));
    }

    [Test]
    [AllureName("Identical RGBA PNGs pass and produce opaque dim pixels")]
    public void IdenticalPngsProduceDimDiff()
    {
        var result = Compare(ExpectedPng, ExpectedPng, 0);
        Assert.That(result.Passed, Is.True);
        Assert.That(result.Message, Is.Empty);
        AssertDiff(result.DiffPng, DimPixels);
    }

    [TestCase(RedChangedPng, 0)]
    [TestCase(GreenChangedPng, 0)]
    [TestCase(BlueChangedPng, 0)]
    [TestCase(AlphaChangedPng, 0)]
    [TestCase(TransparentColorChangedPng, 2)]
    [TestCase(TransparentAlphaChangedPng, 2)]
    [AllureName("Every RGBA channel is compared exactly, including transparent pixels")]
    public void ChangedRgbaPixelProducesMagentaDiff(string actual, int pixel)
    {
        var result = Compare(ExpectedPng, actual, 0);
        Assert.That(result.Passed, Is.False);
        Assert.That(result.Message, Is.EqualTo($"Screenshot diff too high for fixture: {25d:0.00}% > {0d:0.00}%"));
        var pixels = (byte[])DimPixels.Clone();
        new byte[] { 255, 0, 255, 255 }.CopyTo(pixels, pixel * 4);
        AssertDiff(result.DiffPng, pixels);
    }

    [TestCase(NarrowPng, 1, 2, false)]
    [TestCase(NarrowPng, 1, 2, true)]
    [TestCase(ShortPng, 2, 1, false)]
    [TestCase(ShortPng, 2, 1, true)]
    [AllureName("Width and height mismatches fail regardless of threshold and produce red pixels")]
    public void DifferentSizesProduceRedDiff(string resized, int width, int height, bool reverse)
    {
        var result = reverse ? Compare(resized, ExpectedPng, 1) : Compare(ExpectedPng, resized, 1);
        Assert.That(result.Passed, Is.False);
        var expectedSize = reverse ? $"{width}x{height}" : "2x2";
        var actualSize = reverse ? "2x2" : $"{width}x{height}";
        Assert.That(result.Message, Is.EqualTo($"Screenshot size changed for fixture: expected {expectedSize}, actual {actualSize}"));
        var pixels = width == 1
            ? new byte[] { 20, 20, 20, 255, 255, 0, 0, 255, 255, 0, 255, 255, 255, 0, 0, 255 }
            : new byte[] { 20, 20, 20, 255, 38, 38, 38, 255, 255, 0, 0, 255, 255, 0, 0, 255 };
        AssertDiff(result.DiffPng, pixels);
    }

    [TestCase(false)]
    [TestCase(true)]
    [AllureName("Diff canvas uses both maximum dimensions, including pixels outside both images")]
    public void CrossedDimensionsProduceRedDiff(bool reverse)
    {
        var result = reverse ? Compare(NarrowPng, ShortPng, 1) : Compare(ShortPng, NarrowPng, 1);
        Assert.That(result.Passed, Is.False);
        AssertDiff(result.DiffPng, new byte[]
        {
            20, 20, 20, 255, 255, 0, 0, 255,
            255, 0, 0, 255, 255, 0, 0, 255,
        });
    }

    [TestCase(0, false)]
    [TestCase(0.24, false)]
    [TestCase(0.25, true)]
    [TestCase(0.26, true)]
    [AllureName("A diff equal to the threshold passes; a larger diff fails")]
    public void ComparisonHonorsThreshold(double threshold, bool passed)
    {
        var result = Compare(ExpectedPng, AlphaChangedPng, threshold);
        Assert.That(result.Passed, Is.EqualTo(passed));
        Assert.That(result.Message, Is.EqualTo(passed ? "" : $"Screenshot diff too high for fixture: {25d:0.00}% > {threshold * 100:0.00}%"));
    }

    [TestCase(0.99, false)]
    [TestCase(1, true)]
    [AllureName("The threshold uses changed pixels over the full image area")]
    public void AllChangedPixelsHonorThreshold(double threshold, bool passed)
    {
        var result = Compare(ExpectedPng, AllChangedPng, threshold);
        Assert.That(result.Passed, Is.EqualTo(passed));
        AssertDiff(result.DiffPng, new byte[]
        {
            255, 0, 255, 255, 255, 0, 255, 255,
            255, 0, 255, 255, 255, 0, 255, 255,
        });
    }

    [Test]
    [AllureName("Screenshot comparison defaults to screenshotDiffThreshold from config")]
    public void ComparisonUsesConfiguredThreshold()
    {
        var configured = ScreenshotHelper.CompareImages(Convert.FromBase64String(ExpectedPng), Convert.FromBase64String(AlphaChangedPng), "fixture");
        var explicitThreshold = Compare(ExpectedPng, AlphaChangedPng, Config.ConfigReader.TestConfig.ScreenshotDiffThreshold);
        Assert.That(configured.Passed, Is.EqualTo(explicitThreshold.Passed));
        Assert.That(configured.Message, Is.EqualTo(explicitThreshold.Message));
    }

    private static ScreenshotHelper.ImageComparison Compare(string expected, string actual, double threshold) =>
        ScreenshotHelper.CompareImages(Convert.FromBase64String(expected), Convert.FromBase64String(actual), "fixture", threshold);

    private static void AssertDiff(byte[] png, byte[] pixels)
    {
        var image = ImageResult.FromMemory(png, ColorComponents.RedGreenBlueAlpha);
        Assert.That(image.Width, Is.EqualTo(2));
        Assert.That(image.Height, Is.EqualTo(2));
        Assert.That(image.Data, Is.EqualTo(pixels));
    }
}
