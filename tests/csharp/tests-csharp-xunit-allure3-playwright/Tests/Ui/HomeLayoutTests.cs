using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureEpic("Home")]
[AllureFeature("Home layout")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Home layout mount")]
public sealed class HomeLayoutTests : TestBase
{
    [Trait("TestCategory", "ui")]
    [Trait("TestCategory", "mock")]
    [Fact(DisplayName = "Home shows embedded header and reference layout")]
    public void HomeLayoutIsMounted()
    {
        HomePage.OpenPage()
            .ShouldShowLayout()
            .Header.ShouldShowEmbeddedHeader();
    }
}
