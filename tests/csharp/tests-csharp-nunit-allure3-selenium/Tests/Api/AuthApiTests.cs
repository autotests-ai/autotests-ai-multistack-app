using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Api;
using Api.Models;
using Helpers;
using RestSharp;
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
    [Test]
    [Category("api")]
    [Category("smoke")]
    [AllureName("POST /api/auth/login returns the auth contract for a seeded user")]
    public void LoginWithValidCredentials()
    {
        var response = RestSharpHttp.Request(
            Method.Post,
            "/api/auth/login",
            json: new LoginRequest("user1", "password1"));
        Assert.That(response.Status, Is.EqualTo(200), response.Body);
        JsonSchemas.AssertMatches(response.Body, "auth-response.json");
        Assert.That(response.Text("username"), Is.EqualTo("user1"));
        Assert.That(response.Text("redirectUrl"), Is.EqualTo("/"));
    }

    [Test]
    [Category("api")]
    [AllureName("POST /api/auth/login rejects a wrong password with 401")]
    public void LoginWithInvalidPassword()
    {
        var response = RestSharpHttp.Request(
            Method.Post,
            "/api/auth/login",
            json: new LoginRequest("user1", "wrongpassword"));
        Assert.That(response.Status, Is.EqualTo(401), response.Body);
        JsonSchemas.AssertMatches(response.Body, "error.json");
        Assert.That(response.Text("message"), Is.EqualTo(RestSharpHttp.WrongCredentialsMessage));
    }

    [Test]
    [Category("api")]
    [AllureName("POST /api/auth/login answers an unknown user with the same 401 (no enumeration)")]
    public void LoginWithUnknownUsername()
    {
        var response = RestSharpHttp.Request(
            Method.Post,
            "/api/auth/login",
            json: new LoginRequest(DataFaker.Username(), "password123"));
        Assert.That(response.Status, Is.EqualTo(401), response.Body);
        Assert.That(response.Text("message"), Is.EqualTo(RestSharpHttp.WrongCredentialsMessage));
    }

    [Test]
    [Category("api")]
    [AllureName("POST /api/auth/login joins both field errors into one 400 message")]
    public void LoginRejectsEmptyCredentials()
    {
        var response = RestSharpHttp.Request(
            Method.Post,
            "/api/auth/login",
            json: new LoginRequest("", ""));
        Assert.That(response.Status, Is.EqualTo(400), response.Body);
        JsonSchemas.AssertMatches(response.Body, "error.json");
        var message = response.Text("message");
        Assert.That(message, Does.Contain("username"));
        Assert.That(message, Does.Contain("password"));
        Assert.That(message, Does.Contain("; "));
    }

    [Test]
    [Category("api")]
    [Category("negative")]
    [AllureName("POST /api/auth/login rejects a short username with 400")]
    public void LoginRejectsShortUsername() =>
        AssertErrorContains(
            RestSharpHttp.Request(Method.Post, "/api/auth/login", json: new LoginRequest("ab", "password1")),
            400,
            "username");

    [Test]
    [Category("api")]
    [Category("negative")]
    [AllureName("POST /api/auth/login rejects a short password with 400")]
    public void LoginRejectsShortPassword() =>
        AssertErrorContains(
            RestSharpHttp.Request(Method.Post, "/api/auth/login", json: new LoginRequest("user1", "123")),
            400,
            "password");

    [Test]
    [Category("api")]
    [Category("negative")]
    [AllureName("POST /api/auth/login rejects an empty username with 400")]
    public void LoginRejectsEmptyUsername() =>
        AssertErrorContains(
            RestSharpHttp.Request(Method.Post, "/api/auth/login", json: new LoginRequest("", "password1")),
            400,
            "username");

    [Test]
    [Category("api")]
    [Category("negative")]
    [AllureName("POST /api/auth/login rejects an empty password with 400")]
    public void LoginRejectsEmptyPassword() =>
        AssertErrorContains(
            RestSharpHttp.Request(Method.Post, "/api/auth/login", json: new LoginRequest("user1", "")),
            400,
            "password");

    [Test]
    [Category("api")]
    [Category("negative")]
    [AllureName("POST /api/auth/login answers a malformed JSON body with 400, not 401")]
    public void LoginRejectsMalformedJson()
    {
        var response = RestSharpHttp.Request(Method.Post, "/api/auth/login", raw: "not json");
        Assert.That(response.Status, Is.EqualTo(400), response.Body);
        Assert.That(response.Text("message"), Is.EqualTo("Request body is not valid JSON"));
    }

    [Test]
    [Category("api")]
    [AllureName("POST /api/auth/register creates a user, returns the auth contract, and cleans up")]
    public void RegisterNewUser()
    {
        var username = DataFaker.Username();
        var response = RestSharpHttp.Request(
            Method.Post,
            "/api/auth/register",
            json: new RegisterRequest(username, "password123"));
        Assert.That(response.Status, Is.EqualTo(201), response.Body);
        JsonSchemas.AssertMatches(response.Body, "auth-response.json");
        Assert.That(response.Text("username"), Is.EqualTo(username));
        Assert.That(response.Text("redirectUrl"), Is.EqualTo("/"));
        AuthApiClient.DeleteAccount(response.Text("token"));
    }

    [Test]
    [Category("api")]
    [AllureName("POST /api/auth/register rejects a duplicate username with 409")]
    public void RegisterDuplicateUsername()
    {
        var response = RestSharpHttp.Request(
            Method.Post,
            "/api/auth/register",
            json: new RegisterRequest("user1", "password123"));
        Assert.That(response.Status, Is.EqualTo(409), response.Body);
        JsonSchemas.AssertMatches(response.Body, "error.json");
        Assert.That(response.Text("message"), Is.EqualTo("Username already taken"));
    }

    [Test]
    [Category("api")]
    [AllureName("POST /api/auth/register rejects a short password with 400")]
    public void RegisterRejectsShortPassword() =>
        AssertErrorContains(
            RestSharpHttp.Request(
                Method.Post,
                "/api/auth/register",
                json: new RegisterRequest("shortuser", "abc")),
            400,
            "password");

    [Test]
    [Category("api")]
    [AllureName("POST /api/auth/register rejects a short username with 400")]
    public void RegisterRejectsShortUsername() =>
        AssertErrorContains(
            RestSharpHttp.Request(
                Method.Post,
                "/api/auth/register",
                json: new RegisterRequest("ab", "password123")),
            400,
            "username");

    [Test]
    [Category("api")]
    [AllureName("POST /api/auth/register rejects an empty username with 400")]
    public void RegisterRejectsEmptyUsername() =>
        AssertErrorContains(
            RestSharpHttp.Request(
                Method.Post,
                "/api/auth/register",
                json: new RegisterRequest("", "password123")),
            400,
            "username");

    [Test]
    [Category("api")]
    [AllureName("POST /api/auth/register rejects an empty password with 400")]
    public void RegisterRejectsEmptyPassword() =>
        AssertErrorContains(
            RestSharpHttp.Request(
                Method.Post,
                "/api/auth/register",
                json: new RegisterRequest("newuser", "")),
            400,
            "password");

    [Test]
    [Category("api")]
    [AllureName("POST /api/auth/register joins both field errors into one 400 message")]
    public void RegisterRejectsEmptyCredentials()
    {
        var response = RestSharpHttp.Request(
            Method.Post,
            "/api/auth/register",
            json: new RegisterRequest("", ""));
        Assert.That(response.Status, Is.EqualTo(400), response.Body);
        JsonSchemas.AssertMatches(response.Body, "error.json");
        var message = response.Text("message");
        Assert.That(message, Does.Contain("username"));
        Assert.That(message, Does.Contain("password"));
    }

    [Test]
    [Category("api")]
    [AllureName("POST /api/auth/register answers a malformed JSON body with 400, not 401")]
    public void RegisterRejectsMalformedJson()
    {
        var response = RestSharpHttp.Request(Method.Post, "/api/auth/register", raw: "not json");
        Assert.That(response.Status, Is.EqualTo(400), response.Body);
        Assert.That(response.Text("message"), Is.EqualTo("Request body is not valid JSON"));
    }

    [Test]
    [Category("api")]
    [AllureName("GET /api/auth/me returns the profile contract for a bearer token")]
    public void ProfileWithBearerToken()
    {
        var token = AuthApiClient.Login("user1", "password1");
        var response = RestSharpHttp.Request(Method.Get, "/api/auth/me", token: token);
        Assert.That(response.Status, Is.EqualTo(200), response.Body);
        JsonSchemas.AssertMatches(response.Body, "profile.json");
        Assert.That(response.Text("username"), Is.EqualTo("user1"));
    }

    [Test]
    [Category("api")]
    [AllureName("GET /api/auth/me without a token returns 401")]
    public void ProfileWithoutToken()
    {
        var response = RestSharpHttp.Request(Method.Get, "/api/auth/me");
        Assert.That(response.Status, Is.EqualTo(401), response.Body);
    }

    [Test]
    [Category("api")]
    [AllureName("GET /api/auth/me with a garbage token returns 401")]
    public void ProfileWithGarbageToken()
    {
        var response = RestSharpHttp.Request(Method.Get, "/api/auth/me", token: "not-a-jwt");
        Assert.That(response.Status, Is.EqualTo(401), response.Body);
    }

    [Test]
    [Category("api")]
    [AllureName("POST /api/auth/logout returns 204")]
    public void LogoutReturnsNoContent()
    {
        var response = RestSharpHttp.Request(Method.Post, "/api/auth/logout");
        Assert.That(response.Status, Is.EqualTo(204), response.Body);
    }

    [Test]
    [Category("api")]
    [Category("negative")]
    [AllureName("DELETE /api/auth/me without a token returns 401")]
    public void DeleteWithoutToken()
    {
        var response = RestSharpHttp.Request(Method.Delete, "/api/auth/me");
        Assert.That(response.Status, Is.EqualTo(401), response.Body);
    }

    [Test]
    [Category("api")]
    [Category("negative")]
    [AllureName("DELETE /api/auth/me with a garbage token returns 401")]
    public void DeleteWithGarbageToken()
    {
        var response = RestSharpHttp.Request(Method.Delete, "/api/auth/me", token: "not-a-jwt");
        Assert.That(response.Status, Is.EqualTo(401), response.Body);
    }

    [Test]
    [Category("api")]
    [AllureName("DELETE /api/auth/me removes the account: repeated login is rejected")]
    public void DeleteRemovesAccount()
    {
        var username = DataFaker.Username();
        var token = AuthApiClient.Register(username, "password123");
        AuthApiClient.DeleteAccount(token);
        var response = RestSharpHttp.Request(
            Method.Post,
            "/api/auth/login",
            json: new LoginRequest(username, "password123"));
        Assert.That(response.Status, Is.EqualTo(401), response.Body);
        Assert.That(response.Text("message"), Is.EqualTo(RestSharpHttp.WrongCredentialsMessage));
    }

    [Test]
    [Category("api")]
    [AllureName("unmapped /api/* path requires authentication (security catch-all)")]
    public void UnmappedApiPathRequiresAuthentication()
    {
        var response = RestSharpHttp.Request(Method.Get, "/api/nope");
        Assert.That(response.Status, Is.EqualTo(401), response.Body);
    }

    private static void AssertErrorContains(HttpResult response, int status, string fragment)
    {
        Assert.That(response.Status, Is.EqualTo(status), response.Body);
        JsonSchemas.AssertMatches(response.Body, "error.json");
        Assert.That(response.Text("message"), Does.Contain(fragment), response.Body);
    }
}
