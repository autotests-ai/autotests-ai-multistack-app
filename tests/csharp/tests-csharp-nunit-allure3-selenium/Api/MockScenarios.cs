using Allure.NUnit.Attributes;
using Config;
using RestSharp;

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
            var response = RestSharpHttp.Request(Method.Get, "/__admin/scenarios");
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
        var origin = ConfigReader.ResolveApiBaseUrl().TrimEnd('/');
        using var client = new RestClient(origin);
        var request = new RestRequest($"/__admin/scenarios/{scenario}/state", Method.Put);
        request.AddJsonBody(new { state });
        var response = client.Execute(request);
        Assert.That((int)response.StatusCode, Is.EqualTo(200), response.Content);
    }

    [AllureStep("Mock: reset all scenarios")]
    public static void ResetAll()
    {
        var origin = ConfigReader.ResolveApiBaseUrl().TrimEnd('/');
        using var client = new RestClient(origin);
        var request = new RestRequest("/__admin/scenarios/reset", Method.Post);
        var response = client.Execute(request);
        Assert.That((int)response.StatusCode, Is.EqualTo(200), response.Content);
    }
}
