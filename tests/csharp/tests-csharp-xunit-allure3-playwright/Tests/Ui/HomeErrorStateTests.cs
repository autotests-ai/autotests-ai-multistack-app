using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Api;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureEpic("Home")]
[AllureFeature("Error states")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Home error states (mock)")]
public sealed class HomeErrorStateTests : TestBase
{
    private readonly bool _mockStandAvailable = true;

    public HomeErrorStateTests() : this(EnsureMockStand())
    {
    }

    private HomeErrorStateTests(bool _)
    {
    }

    /// <summary>Runs before <see cref="TestBase"/> so a missing mock stand does not start Chromium.</summary>
    private static bool EnsureMockStand()
    {
        if (!MockScenarios.Available())
        {
            throw Xunit.Sdk.SkipException.ForSkip(
                "WireMock admin API is not exposed on this stand — error injection needs the mock profile");
        }

        return true;
    }

    public override void Dispose()
    {
        if (_mockStandAvailable)
        {
            MockScenarios.ResetAll();
        }

        base.Dispose();
    }

    [Trait("TestCategory", "ui")]
    [Trait("TestCategory", "mock")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Items API failure shows a readable error, not a blank page")]
    public void ItemsApiFailureShowsReadableError()
    {
        MockScenarios.SetState("items", "error");
        HomePage.OpenPage()
            .ShouldShowItemsError("✗ items: HTTP 500");
    }

    [Trait("TestCategory", "ui")]
    [Trait("TestCategory", "mock")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Health API failure shows a readable error in the health panel")]
    public void HealthApiFailureShowsReadableError()
    {
        MockScenarios.SetState("health", "error");
        HomePage.OpenPage()
            .ShouldShowHealthError("✗ health: HTTP 500");
    }
}
