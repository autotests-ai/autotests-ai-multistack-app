using System.Net;
using System.Text;
using System.Text.Json;
using Dev.Multistack.App.Api;
using Dev.Multistack.App.Security;
using Dev.Multistack.App.Store;
using Xunit;

namespace BackendCSharpAspnet.Tests;

public sealed class ApiTests
{
    [Fact]
    public async Task Health()
    {
        await using var h = await Harness.CreateAsync(new FakeStore());
        var response = await h.Do(HttpMethod.Get, "/api/health");
        await Harness.RequireStatus(response, HttpStatusCode.OK);
        Assert.Equal(
            """{"status":"ok","service":"backend-csharp-aspnet"}""",
            await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Items()
    {
        await using var h = await Harness.CreateAsync(new FakeStore()
            .WithItem("Alpha", "First seeded item from PostgreSQL")
            .WithItem("Beta", "Second seeded item for demo API"));
        var response = await h.Do(HttpMethod.Get, "/api/items");
        await Harness.RequireStatus(response, HttpStatusCode.OK);
        const string want =
            """{"items":[{"id":1,"name":"Alpha","description":"First seeded item from PostgreSQL"},{"id":2,"name":"Beta","description":"Second seeded item for demo API"}],"source":"postgresql"}""";
        Assert.Equal(want, await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task ItemsEmptyIsAnArrayNotNull()
    {
        await using var h = await Harness.CreateAsync(new FakeStore());
        var response = await h.Do(HttpMethod.Get, "/api/items");
        await Harness.RequireStatus(response, HttpStatusCode.OK);
        Assert.Equal("""{"items":[],"source":"postgresql"}""", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task ItemsDatabaseFailure()
    {
        var fake = new FakeStore { ListItemsError = new InvalidOperationException("db down") };
        await using var h = await Harness.CreateAsync(fake);
        var response = await h.Do(HttpMethod.Get, "/api/items");
        await Harness.RequireStatus(response, HttpStatusCode.InternalServerError);
        await Harness.RequireMessage(response, ApiHandler.MessageServerError);
    }

    [Fact]
    public async Task RegisterCreatesUser()
    {
        await using var h = await Harness.CreateAsync(new FakeStore());
        var response = await h.Do(HttpMethod.Post, "/api/auth/register", """{"username":"newbie","password":"password1"}""");
        await Harness.RequireStatus(response, HttpStatusCode.Created);
        var payload = await Harness.Decode(response);
        Assert.Equal("newbie", payload.GetProperty("username").GetString());
        Assert.Equal("/", payload.GetProperty("redirectUrl").GetString());
        var token = payload.GetProperty("token").GetString();
        Assert.False(string.IsNullOrEmpty(token));
        Assert.Equal("newbie", h.Tokens.Username(token!));
        var created = await h.Store.FindUserByUsernameAsync("newbie", CancellationToken.None);
        Assert.NotEqual("password1", created.PasswordHash);
        Assert.True(PasswordHasher.Check("password1", created.PasswordHash));
    }

    [Fact]
    public async Task RegisterDuplicateUsername()
    {
        await using var h = await Harness.SeededAsync();
        var response = await h.Do(HttpMethod.Post, "/api/auth/register", """{"username":"user1","password":"password1"}""");
        await Harness.RequireStatus(response, HttpStatusCode.Conflict);
        await Harness.RequireMessage(response, ApiHandler.MessageDuplicateUser);
    }

    [Fact]
    public async Task RegisterLostUniqueRace()
    {
        var fake = new FakeStore { CreateUserError = new DuplicateUsernameException() };
        await using var h = await Harness.CreateAsync(fake);
        var response = await h.Do(HttpMethod.Post, "/api/auth/register", """{"username":"racer","password":"password1"}""");
        await Harness.RequireStatus(response, HttpStatusCode.Conflict);
        await Harness.RequireMessage(response, ApiHandler.MessageDuplicateUser);
    }

    [Fact]
    public async Task RegisterLookupDatabaseFailure()
    {
        var fake = new FakeStore { FindUserError = new InvalidOperationException("db down") };
        await using var h = await Harness.CreateAsync(fake);
        var response = await h.Do(HttpMethod.Post, "/api/auth/register", """{"username":"newbie","password":"password1"}""");
        await Harness.RequireStatus(response, HttpStatusCode.InternalServerError);
        await Harness.RequireMessage(response, ApiHandler.MessageServerError);
    }

    [Fact]
    public async Task RegisterInsertDatabaseFailure()
    {
        var fake = new FakeStore { CreateUserError = new InvalidOperationException("db down") };
        await using var h = await Harness.CreateAsync(fake);
        var response = await h.Do(HttpMethod.Post, "/api/auth/register", """{"username":"newbie","password":"password1"}""");
        await Harness.RequireStatus(response, HttpStatusCode.InternalServerError);
        await Harness.RequireMessage(response, ApiHandler.MessageServerError);
    }

    [Fact]
    public async Task LoginSucceeds()
    {
        await using var h = await Harness.SeededAsync();
        var response = await h.Do(HttpMethod.Post, "/api/auth/login", """{"username":"user1","password":"password1"}""");
        await Harness.RequireStatus(response, HttpStatusCode.OK);
        var payload = await Harness.Decode(response);
        Assert.Equal(Harness.TestUser, payload.GetProperty("username").GetString());
        Assert.Equal("/", payload.GetProperty("redirectUrl").GetString());
        Assert.False(string.IsNullOrEmpty(payload.GetProperty("token").GetString()));
    }

    [Theory]
    [InlineData("wrong password", """{"username":"user1","password":"wrong-password"}""")]
    [InlineData("unknown user", """{"username":"ghost","password":"password1"}""")]
    public async Task LoginRejectsBadCredentials(string name, string body)
    {
        _ = name;
        await using var h = await Harness.SeededAsync();
        var response = await h.Do(HttpMethod.Post, "/api/auth/login", body);
        await Harness.RequireStatus(response, HttpStatusCode.Unauthorized);
        await Harness.RequireMessage(response, ApiHandler.MessageBadCredentials);
    }

    [Fact]
    public async Task LoginDatabaseFailure()
    {
        var fake = new FakeStore { FindUserError = new InvalidOperationException("db down") };
        await using var h = await Harness.CreateAsync(fake);
        var response = await h.Do(HttpMethod.Post, "/api/auth/login", """{"username":"user1","password":"password1"}""");
        await Harness.RequireStatus(response, HttpStatusCode.InternalServerError);
        await Harness.RequireMessage(response, ApiHandler.MessageServerError);
    }

    public static TheoryData<string, string, string> CredentialCases() => new()
    {
        { "empty object", "{}", "username is required; password is required" },
        { "username not a string", """{"username":7,"password":"password1"}""", "username is required" },
        { "missing password", """{"username":"user1"}""", "password is required" },
        { "username too short", """{"username":"ab","password":"password1"}""", "username must be 3-64 characters" },
        { "username too long", "{\"username\":\"" + new string('u', 65) + "\",\"password\":\"password1\"}", "username must be 3-64 characters" },
        { "password too short", """{"username":"user1","password":"short"}""", "password must be 6-128 characters" },
        { "password too long", "{\"username\":\"user1\",\"password\":\"" + new string('p', 129) + "\"}", "password must be 6-128 characters" },
        { "both fields blank", """{"username":"","password":""}""", "username is required; password is required" },
        { "both fields too short", """{"username":"ab","password":"short"}""", "username must be 3-64 characters; password must be 6-128 characters" },
        { "blank username with short password", """{"username":"","password":"short"}""", "username is required; password must be 6-128 characters" },
    };

    [Theory]
    [MemberData(nameof(CredentialCases))]
    public async Task CredentialValidationIsRejectedOnRegister(string name, string body, string message)
    {
        _ = name;
        await using var h = await Harness.SeededAsync();
        var response = await h.Do(HttpMethod.Post, "/api/auth/register", body);
        await Harness.RequireStatus(response, HttpStatusCode.BadRequest);
        await Harness.RequireMessage(response, message);
    }

    [Theory]
    [MemberData(nameof(CredentialCases))]
    public async Task CredentialValidationIsRejectedOnLogin(string name, string body, string message)
    {
        _ = name;
        await using var h = await Harness.SeededAsync();
        var response = await h.Do(HttpMethod.Post, "/api/auth/login", body);
        await Harness.RequireStatus(response, HttpStatusCode.BadRequest);
        await Harness.RequireMessage(response, message);
    }

    public static TheoryData<string, string> NotJsonCases() => new()
    {
        { "no body", "" },
        { "plain text", "not json" },
        { "truncated object", "{" },
        { "json array", """["a","b"]""" },
        { "json string", "\"user1\"" },
        { "json number", "42" },
        { "json null", "null" },
    };

    [Theory]
    [MemberData(nameof(NotJsonCases))]
    public async Task BodyThatIsNotAJsonObjectIsRejectedOnRegister(string name, string body)
    {
        _ = name;
        await using var h = await Harness.SeededAsync();
        var response = await h.Do(HttpMethod.Post, "/api/auth/register", body);
        await Harness.RequireStatus(response, HttpStatusCode.BadRequest);
        await Harness.RequireMessage(response, ApiHandler.MessageInvalidJson);
    }

    [Theory]
    [MemberData(nameof(NotJsonCases))]
    public async Task BodyThatIsNotAJsonObjectIsRejectedOnLogin(string name, string body)
    {
        _ = name;
        await using var h = await Harness.SeededAsync();
        var response = await h.Do(HttpMethod.Post, "/api/auth/login", body);
        await Harness.RequireStatus(response, HttpStatusCode.BadRequest);
        await Harness.RequireMessage(response, ApiHandler.MessageInvalidJson);
    }

    [Theory]
    [InlineData("unknown path", "GET", "/api/nope")]
    [InlineData("unknown path under auth", "GET", "/api/auth/nope")]
    [InlineData("method not mapped on login", "GET", "/api/auth/login")]
    [InlineData("method not mapped on items", "DELETE", "/api/items")]
    public async Task UnmappedApiRequestsRequireAuthentication(string name, string method, string path)
    {
        _ = name;
        await using var h = await Harness.SeededAsync();
        var response = await h.Do(new HttpMethod(method), path);
        await Harness.RequireStatus(response, HttpStatusCode.Unauthorized);
        await Harness.RequireMessage(response, ApiHandler.MessageUnauthorized);
    }

    [Fact]
    public async Task UnmappedPathOutsideApiIsNotFound()
    {
        await using var h = await Harness.SeededAsync();
        var response = await h.Do(HttpMethod.Get, "/nope");
        await Harness.RequireStatus(response, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Logout()
    {
        await using var h = await Harness.SeededAsync();
        var response = await h.Do(HttpMethod.Post, "/api/auth/logout");
        await Harness.RequireStatus(response, HttpStatusCode.NoContent);
        Assert.Equal("", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task MeWithValidToken()
    {
        await using var h = await Harness.SeededAsync();
        var token = h.Tokens.Create(Harness.TestUser);
        var response = await h.Do(HttpMethod.Get, "/api/auth/me", headers: Header(token));
        await Harness.RequireStatus(response, HttpStatusCode.OK);
        Assert.Equal("""{"username":"user1"}""", await response.Content.ReadAsStringAsync());
    }

    [Theory]
    [InlineData("no header", null)]
    [InlineData("wrong scheme", "scheme")]
    [InlineData("bearer no space", "nospace")]
    [InlineData("empty token", "empty")]
    [InlineData("garbage token", "garbage")]
    [InlineData("expired token", "expired")]
    [InlineData("foreign signature", "foreign")]
    [InlineData("deleted user", "ghost")]
    public async Task MeRejectsBadTokens(string name, string? kind)
    {
        _ = name;
        await using var h = await Harness.SeededAsync();
        var valid = h.Tokens.Create(Harness.TestUser);
        var header = kind switch
        {
            null => null,
            "scheme" => "Token " + valid,
            "nospace" => "Bearer" + valid,
            "empty" => "Bearer ",
            "garbage" => "Bearer not.a.token",
            "expired" => "Bearer " + new TokenService(Harness.TestSecret, TimeSpan.FromMinutes(-1)).Create(Harness.TestUser),
            "foreign" => "Bearer " + new TokenService("some-other-secret-long-enough-for-hs256", TimeSpan.FromHours(1)).Create(Harness.TestUser),
            "ghost" => "Bearer " + h.Tokens.Create("deleted-user"),
            _ => throw new InvalidOperationException(kind),
        };
        Dictionary<string, string>? headers = header is null ? null : new Dictionary<string, string> { ["Authorization"] = header };
        var response = await h.Do(HttpMethod.Get, "/api/auth/me", headers: headers);
        await Harness.RequireStatus(response, HttpStatusCode.Unauthorized);
        await Harness.RequireMessage(response, ApiHandler.MessageUnauthorized);
    }

    [Fact]
    public async Task MeDatabaseFailure()
    {
        await using var h = await Harness.SeededAsync();
        var token = h.Tokens.Create(Harness.TestUser);
        h.Store.FindUserError = new InvalidOperationException("db down");
        var response = await h.Do(HttpMethod.Get, "/api/auth/me", headers: Header(token));
        await Harness.RequireStatus(response, HttpStatusCode.InternalServerError);
        await Harness.RequireMessage(response, ApiHandler.MessageServerError);
    }

    [Fact]
    public async Task DeleteAccount()
    {
        await using var h = await Harness.SeededAsync();
        var token = h.Tokens.Create(Harness.TestUser);
        var response = await h.Do(HttpMethod.Delete, "/api/auth/me", headers: Header(token));
        await Harness.RequireStatus(response, HttpStatusCode.NoContent);
        Assert.Equal("", await response.Content.ReadAsStringAsync());
        Assert.Empty(h.Store.Users);
        var profile = await h.Do(HttpMethod.Get, "/api/auth/me", headers: Header(token));
        await Harness.RequireStatus(profile, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteAccountWithoutToken()
    {
        await using var h = await Harness.SeededAsync();
        var response = await h.Do(HttpMethod.Delete, "/api/auth/me");
        await Harness.RequireStatus(response, HttpStatusCode.Unauthorized);
        await Harness.RequireMessage(response, ApiHandler.MessageUnauthorized);
        Assert.Single(h.Store.Users);
    }

    [Fact]
    public async Task DeleteAccountDatabaseFailure()
    {
        await using var h = await Harness.SeededAsync();
        var token = h.Tokens.Create(Harness.TestUser);
        h.Store.DeleteUserError = new InvalidOperationException("db down");
        var response = await h.Do(HttpMethod.Delete, "/api/auth/me", headers: Header(token));
        await Harness.RequireStatus(response, HttpStatusCode.InternalServerError);
        await Harness.RequireMessage(response, ApiHandler.MessageServerError);
    }

    [Fact]
    public async Task LoginAfterDeleteIsRejected()
    {
        await using var h = await Harness.CreateAsync(new FakeStore());
        var registered = await h.Do(HttpMethod.Post, "/api/auth/register", """{"username":"gonesoon","password":"password1"}""");
        await Harness.RequireStatus(registered, HttpStatusCode.Created);
        var token = (await Harness.Decode(registered)).GetProperty("token").GetString()!;
        var deleted = await h.Do(HttpMethod.Delete, "/api/auth/me", headers: Header(token));
        await Harness.RequireStatus(deleted, HttpStatusCode.NoContent);
        var loggedIn = await h.Do(HttpMethod.Post, "/api/auth/login", """{"username":"gonesoon","password":"password1"}""");
        await Harness.RequireStatus(loggedIn, HttpStatusCode.Unauthorized);
        await Harness.RequireMessage(loggedIn, ApiHandler.MessageBadCredentials);
    }

    [Fact]
    public async Task MaximumLengthPasswordRoundTrips()
    {
        var password = new string('x', 128);
        await using var h = await Harness.CreateAsync(new FakeStore());
        var registered = await h.Do(HttpMethod.Post, "/api/auth/register", $"{{\"username\":\"longpass\",\"password\":\"{password}\"}}");
        await Harness.RequireStatus(registered, HttpStatusCode.Created);
        var loggedIn = await h.Do(HttpMethod.Post, "/api/auth/login", $"{{\"username\":\"longpass\",\"password\":\"{password}\"}}");
        await Harness.RequireStatus(loggedIn, HttpStatusCode.OK);
        var token = (await Harness.Decode(loggedIn)).GetProperty("token").GetString()!;
        var profile = await h.Do(HttpMethod.Get, "/api/auth/me", headers: Header(token));
        await Harness.RequireStatus(profile, HttpStatusCode.OK);
        Assert.Equal("""{"username":"longpass"}""", await profile.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task RegisterThenLoginThenMe()
    {
        await using var h = await Harness.CreateAsync(new FakeStore());
        var registered = await h.Do(HttpMethod.Post, "/api/auth/register", """{"username":"fresh","password":"password1"}""");
        await Harness.RequireStatus(registered, HttpStatusCode.Created);
        var loggedIn = await h.Do(HttpMethod.Post, "/api/auth/login", """{"username":"fresh","password":"password1"}""");
        await Harness.RequireStatus(loggedIn, HttpStatusCode.OK);
        var token = (await Harness.Decode(loggedIn)).GetProperty("token").GetString()!;
        var profile = await h.Do(HttpMethod.Get, "/api/auth/me", headers: Header(token));
        await Harness.RequireStatus(profile, HttpStatusCode.OK);
        Assert.Equal("""{"username":"fresh"}""", await profile.Content.ReadAsStringAsync());
    }

    private static Dictionary<string, string> Header(string token) =>
        new() { ["Authorization"] = "Bearer " + token };
}
