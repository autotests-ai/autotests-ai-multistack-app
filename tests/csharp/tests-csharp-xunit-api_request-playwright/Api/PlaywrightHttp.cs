using System.Text;
using System.Text.Json;
using Allure.Net.Commons;
using Config;
using Helpers;
using Microsoft.Playwright;

namespace Api;

/// <summary>Shared Playwright APIRequest against <see cref="ConfigReader.ResolveApiBaseUrl"/>.</summary>
public static class PlaywrightHttp
{
    public const string WrongCredentialsMessage = "Wrong login or password";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private static readonly object Gate = new();
    private static IPlaywright? _pw;
    private static IAPIRequestContext? _api;
    private static bool _attach;

    public static void Setup(TestConfig config)
    {
        lock (Gate)
        {
            if (_api != null)
            {
                return;
            }

            _attach = config.EnableAllureRestAssuredListener;
            _pw = Pw.Run(Playwright.CreateAsync());
            _api = Pw.Run(_pw.APIRequest.NewContextAsync(new APIRequestNewContextOptions
            {
                BaseURL = ConfigReader.ResolveApiBaseUrl(config).TrimEnd('/'),
                Timeout = 10_000f,
                IgnoreHTTPSErrors = true,
            }));
        }
    }

    public static HttpResult Request(
        string method,
        string path,
        object? json = null,
        string? raw = null,
        string? token = null)
    {
        var api = _api ?? throw new InvalidOperationException("PlaywrightHttp.Setup() first");
        var options = new APIRequestContextOptions();
        var headers = new Dictionary<string, string>();
        if (json != null || raw != null)
        {
            headers["Content-Type"] = "application/json";
        }

        if (token != null)
        {
            headers["Authorization"] = $"Bearer {token}";
        }

        if (headers.Count > 0)
        {
            options.Headers = headers;
        }

        if (json != null)
        {
            options.DataString = JsonSerializer.Serialize(json, JsonOptions);
        }
        else if (raw != null)
        {
            options.DataString = raw;
        }

        var response = Pw.Run(SendAsync(api, method, PathOf(path), options));
        var status = response.Status;
        var body = Pw.Run(response.TextAsync());
        Attach(method, path, status, body);
        Pw.Run(response.DisposeAsync().AsTask());
        return new HttpResult(status, body);
    }

    private static Task<IAPIResponse> SendAsync(
        IAPIRequestContext api,
        string method,
        string path,
        APIRequestContextOptions options) =>
        method.ToUpperInvariant() switch
        {
            "GET" => api.GetAsync(path, options),
            "POST" => api.PostAsync(path, options),
            "PUT" => api.PutAsync(path, options),
            "DELETE" => api.DeleteAsync(path, options),
            _ => throw new ArgumentOutOfRangeException(nameof(method), method, "unsupported HTTP method"),
        };

    private static void Attach(string method, string path, int status, string body)
    {
        if (!_attach)
        {
            return;
        }

        try
        {
            AllureApi.AddAttachment("Request", "text/plain", Encoding.UTF8.GetBytes($"{method} {path}"));
            AllureApi.AddAttachment("Response", "text/plain", Encoding.UTF8.GetBytes($"{status}\n{body}"));
        }
        catch (Exception)
        {
            // Allure context is optional; never mask the HTTP call.
        }
    }

    private static string PathOf(string path) => path.StartsWith('/') ? path : "/" + path;
}
