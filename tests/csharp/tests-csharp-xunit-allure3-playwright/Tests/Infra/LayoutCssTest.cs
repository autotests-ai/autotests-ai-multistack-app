using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Helpers;
using Tests;

namespace Tests.Infra;

[AllureLabel("layer", "infra")]
[AllureEpic("Test infra")]
[AllureFeature("Layout CSS")]
[AllureSeverity(SeverityLevel.normal)]
[Trait("TestCategory", "infra")]
[Trait("TestCategory", "infra_frontend")]
[AllureSuite("LayoutCss")]
public sealed class LayoutCssTest : AllureMeta
{
    [InlineData("repeat(3, minmax(0, 1fr))", 3)]
    [InlineData("603px 603px", 2)]
    [InlineData("1fr", 1)]
    [InlineData("316px", 1)]
    [InlineData("none", 0)]
    [InlineData(null, 0)]
    [InlineData("", 0)]
    [InlineData("   ", 0)]
    [Theory(DisplayName = "gridColumnCount parses grid-template-columns")]
    public void GridColumnCountParsesGridTemplateColumns(string? gridTemplateColumns, int expected)
    {
        Assert.Equal(expected, LayoutCss.GridColumnCount(gridTemplateColumns));
    }
}
