using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Helpers;
using Tests;

namespace Tests.Infra;

[AllureLabel("layer", "infra")]
[AllureEpic("Test infra")]
[AllureFeature("Layout CSS")]
[AllureSeverity(SeverityLevel.normal)]
[Category("infra")]
[Category("infra_frontend")]
[AllureSuite("LayoutCss")]
public sealed class LayoutCssTest : AllureMeta
{
    [TestCase("repeat(3, minmax(0, 1fr))", 3)]
    [TestCase("603px 603px", 2)]
    [TestCase("1fr", 1)]
    [TestCase("316px", 1)]
    [TestCase("none", 0)]
    [TestCase(null, 0)]
    [TestCase("", 0)]
    [TestCase("   ", 0)]
    [AllureName("gridColumnCount parses grid-template-columns")]
    public void GridColumnCountParsesGridTemplateColumns(string? gridTemplateColumns, int expected)
    {
        Assert.That(LayoutCss.GridColumnCount(gridTemplateColumns), Is.EqualTo(expected));
    }
}
