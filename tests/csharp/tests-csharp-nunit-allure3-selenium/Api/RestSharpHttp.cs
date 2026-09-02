using System.Text;
using System.Text.Json;
using Allure.Net.Commons;
using Config;
using RestSharp;
using RestSharp.Interceptors;
using RestSharp.Serializers.Json;

namespace Api;

/// <summary>Shared RestSharp client against <see cref="ConfigReader.ResolveApiBaseUrl"/>.</summary>
public static class RestSharpHttp
{
    public const string WrongCredentialsMessage = "Wrong login or password";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private static RestClient? _client;
    private static bool _attach;

    public static void Setup(TestConfig config)
    {
        if (_client != null)
        {
            return;
        }

        var origin = ConfigReader.ResolveApiBaseUrl(config).TrimEnd('/');
        _attach = config.EnableAllureRestAssuredListener;
        var options = new RestClientOptions(origin)
        {
            ThrowOnAnyError = false,
            Timeout = TimeSpan.FromSeconds(60),
            Interceptors = [new AllureInterceptor()],
        };
        _client = new RestClient(
            options,
            configureSerialization: s => s.UseSystemTextJson(JsonOptions));
    }

    public static HttpResult Request(
        Method method,
        string path,
        object? json = null,
        string? raw = null,
        string? token = null)
    {
        var client = _client ?? throw new InvalidOperationException("RestSharpHttp.Setup() first");
        var request = new RestRequest(PathOf(path), method);
        if (json != null)
        {
            request.AddJsonBody(json);
        }
        else if (raw != null)
        {
            request.AddStringBody(raw, ContentType.Json);
        }

        if (token != null)
        {
            request.AddHeader("Authorization", $"Bearer {token}");
        }

        var response = client.Execute(request);
        var body = response.Content ?? "";
        if ((int)response.StatusCode == 0 && !string.IsNullOrWhiteSpace(response.ErrorMessage))
        {
            body = response.ErrorMessage;
        }

        return new HttpResult((int)response.StatusCode, body);
    }

    private static string PathOf(string path) => path.StartsWith('/') ? path : "/" + path;

    private sealed class AllureInterceptor : Interceptor
    {
        public override ValueTask BeforeRequest(RestRequest request, CancellationToken cancellationToken)
        {
            if (_attach)
            {
                try
                {
                    AllureApi.AddAttachment(
                        "Request",
                        "text/plain",
                        Encoding.UTF8.GetBytes($"{request.Method} {request.Resource}"));
                }
                catch (Exception)
                {
                    // Allure context is optional; never mask the HTTP call.
                }
            }

            return ValueTask.CompletedTask;
        }

        public override ValueTask AfterRequest(RestResponse response, CancellationToken cancellationToken)
        {
            if (_attach)
            {
                try
                {
                    AllureApi.AddAttachment(
                        "Response",
                        "text/plain",
                        Encoding.UTF8.GetBytes($"{(int)response.StatusCode}"));
                }
                catch (Exception)
                {
                    // Allure context is optional; never mask the HTTP call.
                }
            }

            return ValueTask.CompletedTask;
        }
    }
}
