using Allure.Net.Commons.Attributes;

namespace Api;

/// <summary>
/// WireMock scenario switch for the mock stand (compose profile <c>mock</c>; the gateway
/// proxies <c>/__admin/</c> to WireMock).
/// </summary>
public static class MockScenarios
{
    public static bool Available()
    {
        try
        {
            var response = PlaywrightHttp.Request("GET", "/__admin/scenarios");
            return response.Status == 200;
        }
        catch (Exception)
        {
            return false;
        }
    }

    [AllureStep("Mock: switch scenario {scenario} to state {state}")]
    public static void SetState(string scenario, string state)
    {
        var response = PlaywrightHttp.Request(
            "PUT",
            $"/__admin/scenarios/{scenario}/state",
            json: new { state });
        Assert.True(response.Status == 200, response.Body);
    }

    [AllureStep("Mock: reset all scenarios")]
    public static void ResetAll()
    {
        var response = PlaywrightHttp.Request("POST", "/__admin/scenarios/reset");
        Assert.True(response.Status == 200, response.Body);
    }
}
