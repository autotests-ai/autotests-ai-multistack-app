using Allure.Net.Commons.Attributes;
using RestSharp;
using Xunit.Sdk;

namespace Api;

/// <summary>
/// Thin RestSharp client for test setup and cleanup. API tests use it to arrange
/// state through the product API instead of duplicating raw JSON strings.
/// </summary>
public static class AuthApiClient
{
    [AllureStep("API: register user {username}")]
    public static string Register(string username, string password)
    {
        var response = RestSharpHttp.Request(
            Method.Post,
            "/api/auth/register",
            json: new Models.RegisterRequest(username, password));
        Assert.True(response.Status == 201, response.Body);
        var token = response.Text("token");
        Assert.False(string.IsNullOrEmpty(token), response.Body);
        return token;
    }

    [AllureStep("API: login as {username}")]
    public static string Login(string username, string password)
    {
        var response = RestSharpHttp.Request(
            Method.Post,
            "/api/auth/login",
            json: new Models.LoginRequest(username, password));
        Assert.True(response.Status == 200, response.Body);
        var token = response.Text("token");
        Assert.False(string.IsNullOrEmpty(token), response.Body);
        return token;
    }

    [AllureStep("API: delete current account")]
    public static void DeleteAccount(string token)
    {
        var response = RestSharpHttp.Request(Method.Delete, "/api/auth/me", token: token);
        Assert.True(response.Status == 204, response.Body);
    }

    /// <summary>Cleanup that must not mask the original test failure: logs in and deletes, best-effort.</summary>
    public static void DeleteAccountQuietly(string username, string password)
    {
        try
        {
            DeleteAccount(Login(username, password));
        }
        catch (XunitException)
        {
            // The test that created the user is responsible for its own assertions.
        }
        catch (Exception)
        {
            // A failed cleanup (user never created, stand down) must not re-fail it.
        }
    }
}
