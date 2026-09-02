using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Helpers;
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
}
