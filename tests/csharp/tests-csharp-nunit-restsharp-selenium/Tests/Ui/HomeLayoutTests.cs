using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureEpic("Home")]
[AllureFeature("Home layout")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Home layout mount")]
public sealed class HomeLayoutTests : TestBase
{
    [Test]
    [Category("ui")]
    [Category("mock")]
    [AllureName("Home shows embedded header and reference layout")]
    public void HomeLayoutIsMounted()
    {
        HomePage.OpenPage()
            .ShouldShowLayout()
            .Header.ShouldShowEmbeddedHeader();
    }
}
