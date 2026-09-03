using System.Net;
using System.Text;
using System.Text.Json;
using Dev.Multistack.App;
using Dev.Multistack.App.Security;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace BackendCSharpAspnet.Tests;

public sealed class Harness : IAsyncDisposable
{
    public const string TestSecret = "multistack-dev-secret-change-in-production-min-32-chars";
    public const string TestUser = "user1";
    public const string TestPassword = "password1";

    public required WebApplication App { get; init; }
    public required HttpClient Client { get; init; }
    public required FakeStore Store { get; init; }
    public required TokenService Tokens { get; init; }

    public static async Task<Harness> CreateAsync(FakeStore store)
    {
        var tokens = new TokenService(TestSecret, TimeSpan.FromHours(1));
        var app = WebApp.Create(store, tokens, "backend-csharp-aspnet", "http://127.0.0.1:0");
        await app.StartAsync();
        var client = new HttpClient
        {
            BaseAddress = new Uri(app.Urls.Single().TrimEnd('/') + "/"),
        };
        return new Harness { App = app, Client = client, Store = store, Tokens = tokens };
    }

    public static Task<Harness> SeededAsync()
    {
        var hash = PasswordHasher.Hash(TestPassword);
        return CreateAsync(new FakeStore().WithUser(TestUser, hash));
    }

    public async Task<HttpResponseMessage> Do(
        HttpMethod method,
        string path,
        string? body = null,
        IReadOnlyDictionary<string, string>? headers = null)
    {
        var request = new HttpRequestMessage(method, path);
        if (body is not null)
        {
            request.Content = new StringContent(body, Encoding.UTF8, "application/json");
        }
        else if (method != HttpMethod.Get && method != HttpMethod.Delete && !HttpMethods.IsOptions(method.Method))
        {
            request.Content = new StringContent("", Encoding.UTF8, "application/json");
        }

        if (headers is not null)
        {
            foreach (var (key, value) in headers)
            {
                if (!request.Headers.TryAddWithoutValidation(key, value) && request.Content is not null)
                {
                    request.Content.Headers.TryAddWithoutValidation(key, value);
                }
            }
        }

        return await Client.SendAsync(request);
    }

    public static async Task<JsonElement> Decode(HttpResponseMessage response)
    {
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<JsonElement>(json);
    }

    public static async Task RequireStatus(HttpResponseMessage response, HttpStatusCode status)
    {
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(
            response.StatusCode == status,
            $"status = {(int)response.StatusCode}, want {(int)status} (body {body})");
    }

    public static async Task RequireMessage(HttpResponseMessage response, string want)
    {
        var payload = await Decode(response);
        Assert.Equal(JsonValueKind.Object, payload.ValueKind);
        Assert.Single(payload.EnumerateObject());
        Assert.Equal(want, payload.GetProperty("message").GetString());
    }

    public async ValueTask DisposeAsync()
    {
        Client.Dispose();
        await App.DisposeAsync();
    }
}
