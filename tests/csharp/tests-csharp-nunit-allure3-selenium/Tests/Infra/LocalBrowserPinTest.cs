using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Config;
using Helpers;
using Tests;

namespace Tests.Infra;

[AllureLabel("layer", "infra")]
[AllureEpic("Test infra")]
[AllureFeature("Local browser pin")]
[AllureSeverity(SeverityLevel.normal)]
[Category("infra")]
[Category("infra_frontend")]
[AllureSuite("Local browser pin")]
[NonParallelizable]
public sealed class LocalBrowserPinTest : AllureMeta
{
    private static string Major(string version) => version.Split('.')[0];

    [Test]
    [AllureName("pinnedVersion is a full Chrome for Testing build number")]
    public void PinnedVersionIsFullBuildNumber()
    {
        Assert.That(LocalChromePin.PinnedVersion(), Does.Match(@"^\d+\.\d+\.\d+\.\d+$"));
    }

    [Test]
    [AllureName("configured browserVersion stays on the pinned major")]
    public void ConfiguredBrowserVersionMatchesPin()
    {
        Assert.That(
            Major(ConfigReader.TestConfig.BrowserVersion),
            Is.EqualTo(Major(LocalChromePin.PinnedVersion())),
            "browserVersion and chrome-for-testing.properties drifted apart");
    }

    [Test]
    [AllureName("apply rejects a browserVersion from another major")]
    public void ApplyRejectsForeignMajor()
    {
        var foreignMajor = int.Parse(Major(LocalChromePin.PinnedVersion())) + 1;
        var error = Assert.Throws<InvalidOperationException>(() => LocalChromePin.Apply(foreignMajor.ToString()));
        Assert.That(error!.Message, Does.Contain("pinned build is"));
    }

    [Test]
    [AllureName("apply refuses to fall back to system Chrome")]
    public void ApplyRejectsBlankBrowserVersion()
    {
        var error = Assert.Throws<InvalidOperationException>(() => LocalChromePin.Apply(" "));
        Assert.That(error!.Message, Does.Contain("browserVersion is required"));
    }

    [Test]
    [AllureName("runtime rejects a non-Chrome browser")]
    public void RequireChromeRejectsFirefox()
    {
        var config = new TestConfig { Browser = "firefox" };
        var error = Assert.Throws<InvalidOperationException>(() => WebDrivers.RequireChrome(config));
        Assert.That(error!.Message, Does.Contain("Chrome-only"));
    }
}
