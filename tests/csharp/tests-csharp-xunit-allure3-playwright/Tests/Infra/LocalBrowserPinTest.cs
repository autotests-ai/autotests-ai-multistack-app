using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Config;
using Helpers;
using Tests;

namespace Tests.Infra;

[AllureLabel("layer", "infra")]
[AllureEpic("Test infra")]
[AllureFeature("Local browser pin")]
[AllureSeverity(SeverityLevel.normal)]
[Trait("TestCategory", "infra")]
[Trait("TestCategory", "infra_frontend")]
[AllureSuite("Local browser pin")]
public sealed class LocalBrowserPinTest : AllureMeta
{
    private static string Major(string version) => version.Split('.')[0];

    [Fact(DisplayName = "pinnedVersion is a full Chrome for Testing build number")]
    public void PinnedVersionIsFullBuildNumber()
    {
        Assert.Matches(@"^\d+\.\d+\.\d+\.\d+$", LocalChromePin.PinnedVersion());
    }

    [Fact(DisplayName = "configured browserVersion stays on the pinned major")]
    public void ConfiguredBrowserVersionMatchesPin()
    {
        Assert.True(Equals(Major(LocalChromePin.PinnedVersion()), Major(ConfigReader.TestConfig.BrowserVersion)), "browserVersion and chrome-for-testing.properties drifted apart");
    }

    [Fact(DisplayName = "apply rejects a browserVersion from another major")]
    public void ApplyRejectsForeignMajor()
    {
        var foreignMajor = int.Parse(Major(LocalChromePin.PinnedVersion())) + 1;
        var error = Assert.Throws<InvalidOperationException>(() => LocalChromePin.Apply(foreignMajor.ToString()));
        Assert.Contains("pinned build is", error!.Message);
    }

    [Fact(DisplayName = "apply refuses to fall back to system Chrome")]
    public void ApplyRejectsBlankBrowserVersion()
    {
        var error = Assert.Throws<InvalidOperationException>(() => LocalChromePin.Apply(" "));
        Assert.Contains("browserVersion is required", error!.Message);
    }

    [Fact(DisplayName = "runtime rejects a non-Chromium browser")]
    public void RequireChromeRejectsFirefox()
    {
        var config = new TestConfig { Browser = "firefox" };
        var error = Assert.Throws<InvalidOperationException>(() => PlaywrightRuntime.RequireChromium(config));
        Assert.Contains("Chromium-only", error!.Message);
    }
}
