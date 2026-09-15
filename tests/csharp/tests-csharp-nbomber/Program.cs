// Official PragmaticFlow/NBomber school: closed copies, vegeta-compatible JSONL overlay.
// Overlay: build/nbomber/results.json → load_injector_* (not nbomber_*).
using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using NBomber.Contracts.Stats;
using NBomber.CSharp;
using NBomber.Contracts;
using NBomber.Http.CSharp;

static string FirstNonBlank(params string?[] values)
{
    foreach (var value in values)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            return value.Trim();
        }
    }
    return "";
}

static string EnvOr(string key, string fallback) =>
    FirstNonBlank(Environment.GetEnvironmentVariable(key), fallback);

static int ParsePositive(string raw, int fallback)
{
    return int.TryParse(raw, out var value) ? Math.Max(1, value) : fallback;
}

static string StripSlash(string url) => url.TrimEnd('/');

static string ApiBaseUrl() =>
    StripSlash(
        FirstNonBlank(
            Environment.GetEnvironmentVariable("API_BASE_URL"),
            Environment.GetEnvironmentVariable("apiBaseUrl"),
            "http://localhost:8800"
        )
    );

static string Username() =>
    FirstNonBlank(
        Environment.GetEnvironmentVariable("LOAD_USERNAME"),
        Environment.GetEnvironmentVariable("username"),
        "user1"
    );

static string Password() =>
    FirstNonBlank(
        Environment.GetEnvironmentVariable("LOAD_PASSWORD"),
        Environment.GetEnvironmentVariable("password"),
        "password1"
    );

static string Profile() => EnvOr("NBOBBER_PROFILE", "smoke").ToLowerInvariant();

static bool AllowPublic() =>
    string.Equals(EnvOr("NBOBBER_ALLOW_PUBLIC", "false"), "true", StringComparison.OrdinalIgnoreCase);

static string SchoolRoot()
{
    var root = AppContext.BaseDirectory;
    // bin/Release/net8.0 → school root
    return Path.GetFullPath(Path.Combine(root, "..", "..", ".."));
}

static string JsonlPath()
{
    var raw = Environment.GetEnvironmentVariable("NBOBBER_JSONL");
    if (!string.IsNullOrWhiteSpace(raw))
    {
        return raw;
    }
    return Path.Combine(SchoolRoot(), "build", "nbomber", "results.json");
}

static string HtmlReportFolder()
{
    var raw = Environment.GetEnvironmentVariable("NBOBBER_HTML_FOLDER");
    if (!string.IsNullOrWhiteSpace(raw))
    {
        return raw;
    }
    return Path.Combine(SchoolRoot(), "build", "nbomber", "nbomber-html");
}

static string PublishReportDir()
{
    var jsonl = JsonlPath();
    var parent = Path.GetDirectoryName(jsonl);
    if (string.IsNullOrEmpty(parent))
    {
        return Path.Combine(SchoolRoot(), "build", "nbomber", "report");
    }
    return Path.Combine(parent, "report");
}

static void PublishHtmlReport(NodeStats stats)
{
    var html = stats.ReportFiles.FirstOrDefault(file => file.ReportFormat == ReportFormat.Html);
    if (html is null || string.IsNullOrWhiteSpace(html.FilePath) || !File.Exists(html.FilePath))
    {
        Console.Error.WriteLine("STOP: NBomber HtmlReport was not written");
        Environment.Exit(1);
    }
    var destDir = PublishReportDir();
    Directory.CreateDirectory(destDir);
    File.Copy(html.FilePath, Path.Combine(destDir, "index.html"), overwrite: true);
    var srcDir = Path.GetDirectoryName(html.FilePath);
    if (string.IsNullOrEmpty(srcDir))
    {
        return;
    }
    foreach (var extra in Directory.EnumerateFiles(srcDir))
    {
        if (string.Equals(extra, html.FilePath, StringComparison.Ordinal))
        {
            continue;
        }
        var ext = Path.GetExtension(extra);
        if (
            ext is ".css" or ".js" or ".png" or ".svg" or ".woff" or ".woff2" or ".map"
        )
        {
            File.Copy(extra, Path.Combine(destDir, Path.GetFileName(extra)), overwrite: true);
        }
    }
}

static string UrlHost(string url)
{
    if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
    {
        return "";
    }
    return uri.Host.ToLowerInvariant();
}

static void RefuseSharedProd(string baseUrl)
{
    var lower = baseUrl.ToLowerInvariant();
    var host = UrlHost(lower);
    var isLoad = host == "load.autotests.ai" || host.EndsWith(".load.autotests.ai");
    var shared = lower.Contains("autotests.ai") || lower.Contains("qa.guru");
    if (shared && !isLoad)
    {
        Console.Error.WriteLine(
            $"Refusing {baseUrl} — only load.autotests.ai is an allowed public SUT (not autotests.ai, not Box2)."
        );
        Environment.Exit(1);
    }
    if (isLoad && !AllowPublic())
    {
        Console.Error.WriteLine(
            $"Refusing {baseUrl} — isolated SUT only. Pass NBOBBER_ALLOW_PUBLIC=true when the host is the dedicated load stand."
        );
        Environment.Exit(1);
    }
}

static string JoinApi(string baseUrl, string path) =>
    $"{StripSlash(baseUrl)}/{path.TrimStart('/')}";

var jsonlLock = new object();
StreamWriter? jsonl = null;

void OpenJsonl(string path)
{
    Directory.CreateDirectory(Path.GetDirectoryName(path)!);
    jsonl = new StreamWriter(new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.Read))
    {
        AutoFlush = true,
    };
}

void Record(string method, string url, int code, long latencyNs, string error)
{
    var line = JsonSerializer.Serialize(
        new Dictionary<string, object?>
        {
            ["timestamp"] = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            ["latency"] = latencyNs,
            ["code"] = code,
            ["error"] = error,
            ["method"] = method,
            ["url"] = url,
        }
    );
    lock (jsonlLock)
    {
        jsonl!.WriteLine(line);
        jsonl.Flush();
    }
}

async Task<(bool Ok, string Body)> SendAsync(
    HttpClient client,
    HttpMethod method,
    string url,
    string? token,
    HttpContent? body,
    CancellationToken ct
)
{
    using var request = new HttpRequestMessage(method, url);
    request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    request.Headers.TryAddWithoutValidation("User-Agent", "tests-csharp-nbomber");
    if (!string.IsNullOrEmpty(token))
    {
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }
    if (body != null)
    {
        request.Content = body;
    }
    var sw = Stopwatch.StartNew();
    int code = 0;
    string error = "";
    string responseBody = "";
    try
    {
        using var response = await client.SendAsync(request, ct).ConfigureAwait(false);
        code = (int)response.StatusCode;
        responseBody = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
        if (code == 0 || code >= 400)
        {
            error = code == 0 ? "error" : code.ToString();
        }
    }
    catch (Exception ex)
    {
        error = ex.GetType().Name;
    }
    sw.Stop();
    var latencyNs = (long)(sw.Elapsed.TotalMilliseconds * 1_000_000.0);
    Record(method.Method, url, code, latencyNs, error);
    return (string.IsNullOrEmpty(error), responseBody);
}

static string ParseToken(string body)
{
    if (string.IsNullOrWhiteSpace(body))
    {
        return "";
    }
    try
    {
        using var doc = JsonDocument.Parse(body);
        if (
            doc.RootElement.TryGetProperty("token", out var tokenEl)
            && tokenEl.GetString() is { Length: > 0 } parsed
            && doc.RootElement.TryGetProperty("username", out var userEl)
            && userEl.GetString() == Username()
        )
        {
            return parsed;
        }
    }
    catch (JsonException)
    {
        return "";
    }
    return "";
}

var baseUrl = ApiBaseUrl();
RefuseSharedProd(baseUrl);
var jsonlPath = JsonlPath();
OpenJsonl(jsonlPath);

var http = Http.CreateDefaultClient();
http.Timeout = TimeSpan.FromSeconds(30);

var profile = Profile();
int copies;
List<LoadSimulation> simulations;
if (profile == "load")
{
    copies = ParsePositive(EnvOr("LOAD_VUS", "10"), 10);
    var ramp = ParsePositive(EnvOr("LOAD_RAMP_SECONDS", "10"), 10);
    var hold = ParsePositive(EnvOr("LOAD_DURING_SECONDS", "60"), 60);
    simulations =
    [
        Simulation.RampingConstant(copies: copies, during: TimeSpan.FromSeconds(ramp)),
        Simulation.KeepConstant(copies: copies, during: TimeSpan.FromSeconds(hold)),
    ];
    Console.Error.WriteLine(
        $"nbomber host={baseUrl}/ profile=load copies={copies} ramp={ramp}s hold={hold}s jsonl={jsonlPath}"
    );
}
else
{
    copies = 1;
    simulations = [Simulation.IterationsForConstant(copies: 1, iterations: 1)];
    Console.Error.WriteLine($"nbomber host={baseUrl}/ profile=smoke copies=1 iterations=1 jsonl={jsonlPath}");
}

var scenario = Scenario
    .Create(
        "AuthApi",
        async _ =>
        {
            var ct = CancellationToken.None;
            var ok = true;
            string token = "";

            var health = await SendAsync(http, HttpMethod.Get, JoinApi(baseUrl, "api/health"), null, null, ct);
            ok &= health.Ok;
            var login = await SendAsync(
                http,
                HttpMethod.Post,
                JoinApi(baseUrl, "api/auth/login"),
                null,
                new StringContent(
                    JsonSerializer.Serialize(new { username = Username(), password = Password() }),
                    Encoding.UTF8,
                    "application/json"
                ),
                ct
            );
            ok &= login.Ok;
            token = ParseToken(login.Body);
            var me = await SendAsync(http, HttpMethod.Get, JoinApi(baseUrl, "api/auth/me"), token, null, ct);
            ok &= me.Ok;
            var items = await SendAsync(http, HttpMethod.Get, JoinApi(baseUrl, "api/items"), null, null, ct);
            ok &= items.Ok;
            var logout = await SendAsync(
                http,
                HttpMethod.Post,
                JoinApi(baseUrl, "api/auth/logout"),
                token,
                null,
                ct
            );
            ok &= logout.Ok;
            return ok ? Response.Ok() : Response.Fail();
        }
    )
    .WithoutWarmUp()
    .WithLoadSimulations(simulations.ToArray());

var stats = NBomberRunner
    .RegisterScenarios(scenario)
    .WithReportFolder(HtmlReportFolder())
    .WithReportFileName("nbomber")
    .WithReportFormats(ReportFormat.Html)
    .Run();
jsonl?.Dispose();
PublishHtmlReport(stats);
