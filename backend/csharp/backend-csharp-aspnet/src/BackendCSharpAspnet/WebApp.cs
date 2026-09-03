using System.Text.Json;
using Dev.Multistack.App.Api;
using Dev.Multistack.App.Security;
using Dev.Multistack.App.Store;

namespace Dev.Multistack.App;

/// <summary>
/// HTTP composition root. Frontends stay on separate nginx containers; Swagger UI is
/// under /api/docs so the gateway /api/ proxy reaches it.
/// </summary>
public static class WebApp
{
    public static WebApplication Create(
        IStore store,
        TokenService tokens,
        string serviceName,
        string listenUrl)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = Environments.Production,
        });
        builder.WebHost.UseUrls(listenUrl);
        builder.Logging.ClearProviders();
        builder.Logging.AddConsole();
        builder.Services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.SerializerOptions.PropertyNameCaseInsensitive = false;
        });

        var app = builder.Build();
        var handler = new ApiHandler(store, tokens, serviceName, app.Logger);

        app.UseMiddleware<CorsMiddleware>();
        app.UseStatusCodePages(async status =>
        {
            var http = status.HttpContext;
            if (!http.Request.Path.StartsWithSegments(CorsMiddleware.ApiPrefix))
            {
                return;
            }

            if (http.Response.StatusCode is StatusCodes.Status404NotFound or StatusCodes.Status405MethodNotAllowed)
            {
                http.Response.StatusCode = StatusCodes.Status401Unauthorized;
                http.Response.ContentType = "application/json; charset=utf-8";
                await http.Response.WriteAsJsonAsync(new ErrorResponse { Message = ApiHandler.MessageUnauthorized });
            }
        });

        app.MapGet("/api/health", () => handler.Health());
        app.MapGet("/api/items", async (CancellationToken ct) => await handler.Items(ct));
        app.MapGet("/api/openapi.yaml", () => handler.OpenApiSpec());
        app.MapGet("/api/docs", () => handler.OpenApiDocs());
        app.MapPost("/api/auth/register", (Delegate)(async (HttpContext ctx) => await handler.Register(ctx)));
        app.MapPost("/api/auth/login", (Delegate)(async (HttpContext ctx) => await handler.Login(ctx)));
        app.MapPost("/api/auth/logout", () => handler.Logout());
        app.MapGet("/api/auth/me", (Delegate)((HttpContext ctx) => handler.Me(ctx))).AddEndpointFilter(AuthFilter(handler));
        app.MapDelete("/api/auth/me", (Delegate)(async (HttpContext ctx) => await handler.DeleteAccount(ctx))).AddEndpointFilter(AuthFilter(handler));

        return app;
    }

    private static Func<EndpointFilterInvocationContext, EndpointFilterDelegate, ValueTask<object?>> AuthFilter(
        ApiHandler handler) =>
        async (context, next) =>
        {
            var rejected = await handler.Authenticate(context.HttpContext);
            if (rejected is not null)
            {
                return rejected;
            }

            return await next(context);
        };
}
