namespace Dev.Multistack.App.Api;

/// <summary>
/// CORS mirrors the reference configuration: every origin, no credentials (auth is a
/// Bearer token, never an ambient cookie), Authorization exposed to the browser.
/// </summary>
public sealed class CorsMiddleware
{
    public const string ApiPrefix = "/api";
    public const string AllowedMethods = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
    public const string ExposedHeaders = "Authorization";

    private readonly RequestDelegate _next;

    public CorsMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments(ApiPrefix))
        {
            await _next(context);
            return;
        }

        Apply(context);
        if (HttpMethods.IsOptions(context.Request.Method))
        {
            context.Response.StatusCode = StatusCodes.Status204NoContent;
            return;
        }

        await _next(context);
    }

    public static void Apply(HttpContext context)
    {
        var headers = context.Response.Headers;
        headers["Access-Control-Allow-Origin"] = "*";
        headers["Access-Control-Allow-Methods"] = AllowedMethods;
        headers["Access-Control-Expose-Headers"] = ExposedHeaders;
        headers["Access-Control-Max-Age"] = "600";
        var requested = context.Request.Headers["Access-Control-Request-Headers"].ToString();
        if (string.IsNullOrEmpty(requested))
        {
            requested = "*";
        }

        headers["Access-Control-Allow-Headers"] = requested;
        headers.Append("Vary", "Origin");
        headers.Append("Vary", "Access-Control-Request-Headers");
    }
}
