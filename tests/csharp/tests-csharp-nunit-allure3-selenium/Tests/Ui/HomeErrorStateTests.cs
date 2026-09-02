using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Api;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureEpic("Home")]
[AllureFeature("Error states")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Home error states (mock)")]
[NonParallelizable]
public sealed class HomeErrorStateTests : TestBase
{
    private bool _mockStandAvailable;

    [SetUp]
    public void RequireMockStand()
    {
        _mockStandAvailable = MockScenarios.Available();
        Assume.That(
            _mockStandAvailable,
            "WireMock admin API is not exposed on this stand — error injection needs the mock profile");
    }

    [TearDown]
    public void ResetScenarios()
    {
        if (_mockStandAvailable)
        {
            MockScenarios.ResetAll();
        }
    }

    [Test]
    [Category("ui")]
    [Category("mock")]
    [Category("negative")]
    [AllureName("Items API failure shows a readable error, not a blank page")]
    public void ItemsApiFailureShowsReadableError()
    {
        MockScenarios.SetState("items", "error");
        HomePage.OpenPage()
            .ShouldShowItemsError("✗ items: HTTP 500");
    }

    [Test]
    [Category("ui")]
    [Category("mock")]
    [Category("negative")]
    [AllureName("Health API failure shows a readable error in the health panel")]
    public void HealthApiFailureShowsReadableError()
    {
        MockScenarios.SetState("health", "error");
        HomePage.OpenPage()
            .ShouldShowHealthError("✗ health: HTTP 500");
    }
}
