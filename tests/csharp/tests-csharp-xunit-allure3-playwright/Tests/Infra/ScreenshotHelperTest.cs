using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Helpers;
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
}
