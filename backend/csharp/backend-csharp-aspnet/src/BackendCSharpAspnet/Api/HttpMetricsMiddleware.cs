using System.Diagnostics;
using Prometheus;

namespace Dev.Multistack.App.Api;

/// <summary>
/// Records request duration as Spring Boot's <c>http_server_requests_seconds</c> histogram.
/// prometheus-net <c>UseHttpMetrics</c> exports <c>http_request_duration_seconds</c> instead.
/// </summary>
internal sealed class HttpMetricsMiddleware
{
    private static readonly Histogram Duration = Metrics.CreateHistogram(
        "http_server_requests_seconds",
        "HTTP request duration in seconds",
        new HistogramConfiguration
        {
            LabelNames = new[] { "method", "uri", "status" },
        });

    private readonly RequestDelegate _next;

    public HttpMetricsMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var method = context.Request.Method;
            var uri = context.Request.Path.HasValue ? context.Request.Path.Value! : "/";
            var status = context.Response.StatusCode.ToString();
            Duration.WithLabels(method, uri, status).Observe(stopwatch.Elapsed.TotalSeconds);
        }
    }
}
