using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Api;
using Api.Models;
using Helpers;
using Tests;

namespace Tests.Api;

/// <summary>
/// HTTP contract of <c>/api/auth</c> (login, register, me, logout): status codes, response schemas, error envelopes.
/// Deployed-stand wiring facts (seed catalogue, DB round-trips) live in sibling <c>*ApiTests</c>.
/// </summary>
[AllureEpic("Authentication")]
[AllureFeature("Authentication")]
[AllureSeverity(SeverityLevel.critical)]
[AllureSuite("Auth API")]
public sealed class AuthApiTests : ApiTestBase
{
    [Trait("TestCategory", "api")]
    [Trait("TestCategory", "smoke")]
    [Fact(DisplayName = "POST /api/auth/login returns the auth contract for a seeded user")]
    public void LoginWithValidCredentials()
    {
        var response = PlaywrightHttp.Request(
            "POST",
            "/api/auth/login",
            json: new LoginRequest("user1", "password1"));
        Assert.True(Equals(200, response.Status), response.Body);
        JsonSchemas.AssertMatches(response.Body, "auth-response.json");
        Assert.Equal("user1", response.Text("username"));
        Assert.Equal("/", response.Text("redirectUrl"));
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "POST /api/auth/login rejects a wrong password with 401")]
    public void LoginWithInvalidPassword()
    {
        var response = PlaywrightHttp.Request(
            "POST",
            "/api/auth/login",
            json: new LoginRequest("user1", "wrongpassword"));
        Assert.True(Equals(401, response.Status), response.Body);
        JsonSchemas.AssertMatches(response.Body, "error.json");
        Assert.Equal(PlaywrightHttp.WrongCredentialsMessage, response.Text("message"));
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "POST /api/auth/login answers an unknown user with the same 401 (no enumeration)")]
    public void LoginWithUnknownUsername()
    {
        var response = PlaywrightHttp.Request(
            "POST",
            "/api/auth/login",
            json: new LoginRequest(DataFaker.Username(), "password123"));
        Assert.True(Equals(401, response.Status), response.Body);
        Assert.Equal(PlaywrightHttp.WrongCredentialsMessage, response.Text("message"));
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "POST /api/auth/login joins both field errors into one 400 message")]
    public void LoginRejectsEmptyCredentials()
    {
        var response = PlaywrightHttp.Request(
            "POST",
            "/api/auth/login",
            json: new LoginRequest("", ""));
        Assert.True(Equals(400, response.Status), response.Body);
        JsonSchemas.AssertMatches(response.Body, "error.json");
        var message = response.Text("message");
        Assert.Contains("username", message);
        Assert.Contains("password", message);
        Assert.Contains("; ", message);
    }

    [Trait("TestCategory", "api")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "POST /api/auth/login rejects a short username with 400")]
    public void LoginRejectsShortUsername() =>
        AssertErrorContains(
            PlaywrightHttp.Request("POST", "/api/auth/login", json: new LoginRequest("ab", "password1")),
            400,
            "username");

    [Trait("TestCategory", "api")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "POST /api/auth/login rejects a short password with 400")]
    public void LoginRejectsShortPassword() =>
        AssertErrorContains(
            PlaywrightHttp.Request("POST", "/api/auth/login", json: new LoginRequest("user1", "123")),
            400,
            "password");

    [Trait("TestCategory", "api")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "POST /api/auth/login rejects an empty username with 400")]
    public void LoginRejectsEmptyUsername() =>
        AssertErrorContains(
            PlaywrightHttp.Request("POST", "/api/auth/login", json: new LoginRequest("", "password1")),
            400,
            "username");

    [Trait("TestCategory", "api")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "POST /api/auth/login rejects an empty password with 400")]
    public void LoginRejectsEmptyPassword() =>
        AssertErrorContains(
            PlaywrightHttp.Request("POST", "/api/auth/login", json: new LoginRequest("user1", "")),
            400,
            "password");

    [Trait("TestCategory", "api")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "POST /api/auth/login answers a malformed JSON body with 400, not 401")]
    public void LoginRejectsMalformedJson()
    {
        var response = PlaywrightHttp.Request("POST", "/api/auth/login", raw: "not json");
        Assert.True(Equals(400, response.Status), response.Body);
        Assert.Equal("Request body is not valid JSON", response.Text("message"));
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "POST /api/auth/register creates a user, returns the auth contract, and cleans up")]
    public void RegisterNewUser()
    {
        var username = DataFaker.Username();
        var response = PlaywrightHttp.Request(
            "POST",
            "/api/auth/register",
            json: new RegisterRequest(username, "password123"));
        Assert.True(Equals(201, response.Status), response.Body);
        JsonSchemas.AssertMatches(response.Body, "auth-response.json");
        Assert.Equal(username, response.Text("username"));
        Assert.Equal("/", response.Text("redirectUrl"));
        AuthApiClient.DeleteAccount(response.Text("token"));
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "POST /api/auth/register accepts a 3-character username and 6-character password")]
    public void RegisterAcceptsMinimumLengthCredentials()
    {
        var username = DataFaker.UsernameAtMinLength();
        var response = PlaywrightHttp.Request(
            "POST",
            "/api/auth/register",
            json: new RegisterRequest(username, DataFaker.PasswordAtMinLength()));
        Assert.True(Equals(201, response.Status), response.Body);
        JsonSchemas.AssertMatches(response.Body, "auth-response.json");
        Assert.Equal(username, response.Text("username"));
        AuthApiClient.DeleteAccount(response.Text("token"));
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "POST /api/auth/login with min-length unknown user is 401, not 400")]
    public void LoginMinLengthUnknownUserIsUnauthorized()
    {
        var response = PlaywrightHttp.Request(
            "POST",
            "/api/auth/login",
            json: new LoginRequest(DataFaker.UsernameAtMinLength(), DataFaker.PasswordAtMinLength()));
        Assert.True(Equals(401, response.Status), response.Body);
        JsonSchemas.AssertMatches(response.Body, "error.json");
        Assert.Equal(PlaywrightHttp.WrongCredentialsMessage, response.Text("message"));
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "POST /api/auth/register rejects a duplicate username with 409")]
    public void RegisterDuplicateUsername()
    {
        var response = PlaywrightHttp.Request(
            "POST",
            "/api/auth/register",
            json: new RegisterRequest("user1", "password123"));
        Assert.True(Equals(409, response.Status), response.Body);
        JsonSchemas.AssertMatches(response.Body, "error.json");
        Assert.Equal("Username already taken", response.Text("message"));
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "POST /api/auth/register rejects a short password with 400")]
    public void RegisterRejectsShortPassword() =>
        AssertErrorContains(
            PlaywrightHttp.Request(
                "POST",
                "/api/auth/register",
                json: new RegisterRequest("shortuser", "abc")),
            400,
            "password");

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "POST /api/auth/register rejects a short username with 400")]
    public void RegisterRejectsShortUsername() =>
        AssertErrorContains(
            PlaywrightHttp.Request(
                "POST",
                "/api/auth/register",
                json: new RegisterRequest("ab", "password123")),
            400,
            "username");

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "POST /api/auth/register rejects an empty username with 400")]
    public void RegisterRejectsEmptyUsername() =>
        AssertErrorContains(
            PlaywrightHttp.Request(
                "POST",
                "/api/auth/register",
                json: new RegisterRequest("", "password123")),
            400,
            "username");

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "POST /api/auth/register rejects an empty password with 400")]
    public void RegisterRejectsEmptyPassword() =>
        AssertErrorContains(
            PlaywrightHttp.Request(
                "POST",
                "/api/auth/register",
                json: new RegisterRequest("newuser", "")),
            400,
            "password");

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "POST /api/auth/register joins both field errors into one 400 message")]
    public void RegisterRejectsEmptyCredentials()
    {
        var response = PlaywrightHttp.Request(
            "POST",
            "/api/auth/register",
            json: new RegisterRequest("", ""));
        Assert.True(Equals(400, response.Status), response.Body);
        JsonSchemas.AssertMatches(response.Body, "error.json");
        var message = response.Text("message");
        Assert.Contains("username", message);
        Assert.Contains("password", message);
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "POST /api/auth/register answers a malformed JSON body with 400, not 401")]
    public void RegisterRejectsMalformedJson()
    {
        var response = PlaywrightHttp.Request("POST", "/api/auth/register", raw: "not json");
        Assert.True(Equals(400, response.Status), response.Body);
        Assert.Equal("Request body is not valid JSON", response.Text("message"));
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "GET /api/auth/me returns the profile contract for a bearer token")]
    public void ProfileWithBearerToken()
    {
        var token = AuthApiClient.Login("user1", "password1");
        var response = PlaywrightHttp.Request("GET", "/api/auth/me", token: token);
        Assert.True(Equals(200, response.Status), response.Body);
        JsonSchemas.AssertMatches(response.Body, "profile.json");
        Assert.Equal("user1", response.Text("username"));
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "GET /api/auth/me without a token returns 401")]
    public void ProfileWithoutToken()
    {
        var response = PlaywrightHttp.Request("GET", "/api/auth/me");
        Assert.True(Equals(401, response.Status), response.Body);
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "GET /api/auth/me with a garbage token returns 401")]
    public void ProfileWithGarbageToken()
    {
        var response = PlaywrightHttp.Request("GET", "/api/auth/me", token: "not-a-jwt");
        Assert.True(Equals(401, response.Status), response.Body);
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "POST /api/auth/logout returns 204")]
    public void LogoutReturnsNoContent()
    {
        var response = PlaywrightHttp.Request("POST", "/api/auth/logout");
        Assert.True(Equals(204, response.Status), response.Body);
    }

    [Trait("TestCategory", "api")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "DELETE /api/auth/me without a token returns 401")]
    public void DeleteWithoutToken()
    {
        var response = PlaywrightHttp.Request("DELETE", "/api/auth/me");
        Assert.True(Equals(401, response.Status), response.Body);
    }

    [Trait("TestCategory", "api")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "DELETE /api/auth/me with a garbage token returns 401")]
    public void DeleteWithGarbageToken()
    {
        var response = PlaywrightHttp.Request("DELETE", "/api/auth/me", token: "not-a-jwt");
        Assert.True(Equals(401, response.Status), response.Body);
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "DELETE /api/auth/me removes the account: repeated login is rejected")]
    public void DeleteRemovesAccount()
    {
        var username = DataFaker.Username();
        var token = AuthApiClient.Register(username, "password123");
        AuthApiClient.DeleteAccount(token);
        var response = PlaywrightHttp.Request(
            "POST",
            "/api/auth/login",
            json: new LoginRequest(username, "password123"));
        Assert.True(Equals(401, response.Status), response.Body);
        Assert.Equal(PlaywrightHttp.WrongCredentialsMessage, response.Text("message"));
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "unmapped /api/* path requires authentication (security catch-all)")]
    public void UnmappedApiPathRequiresAuthentication()
    {
        var response = PlaywrightHttp.Request("GET", "/api/nope");
        Assert.True(Equals(401, response.Status), response.Body);
    }

    private static void AssertErrorContains(HttpResult response, int status, string fragment)
    {
        Assert.True(Equals(status, response.Status), response.Body);
        JsonSchemas.AssertMatches(response.Body, "error.json");
        Assert.True(response.Text("message").Contains(fragment), response.Body);
    }
}
