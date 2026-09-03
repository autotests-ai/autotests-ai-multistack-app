using System.Text.Json;
using Dev.Multistack.App.Config;
using Dev.Multistack.App.Security;
using Dev.Multistack.App.Store;

namespace Dev.Multistack.App.Api;

/// <summary>Serves /api/**. It only knows <see cref="IStore"/>, never the driver.</summary>
public sealed class ApiHandler
{
    public const string MessageBadCredentials = "Wrong login or password";
    public const string MessageUnauthorized = "Unauthorized";
    public const string MessageDuplicateUser = "Username already taken";
    public const string MessageInvalidJson = "Request body is not valid JSON";
    public const string MessageServerError = "Internal server error";
    public const string ItemsSource = "postgresql";
    public const string BearerPrefix = "Bearer ";
    public const string AuthHeader = "Authorization";
    public const string UsernameItem = "username";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = false,
    };

    private readonly IStore _store;
    private readonly TokenService _tokens;
    private readonly string _serviceName;
    private readonly ILogger _logger;

    public ApiHandler(IStore store, TokenService tokens, string serviceName, ILogger logger)
    {
        _store = store;
        _tokens = tokens;
        _serviceName = serviceName;
        _logger = logger;
    }

    public IResult Health() =>
        Results.Json(new HealthResponse { Status = "ok", Service = _serviceName });

    public async Task<IResult> Items(CancellationToken cancellationToken)
    {
        try
        {
            var rows = await _store.ListItemsAsync(cancellationToken);
            var items = rows.Select(row => new ItemDto
            {
                Id = row.Id,
                Name = row.Name,
                Description = row.Description,
            }).ToList();
            return Results.Json(new ItemsResponse { Items = items, Source = ItemsSource });
        }
        catch (Exception ex)
        {
            return ServerError(ex);
        }
    }

    public IResult OpenApiSpec()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Resources", "openapi.yaml");
        return Results.Bytes(File.ReadAllBytes(path), "application/yaml");
    }

    public IResult OpenApiDocs()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Resources", "openapi-docs.html");
        return Results.Bytes(File.ReadAllBytes(path), "text/html; charset=utf-8");
    }

    public async Task<IResult> Register(HttpContext context)
    {
        var credentials = await ReadCredentials(context);
        if (credentials is IResult early)
        {
            return early;
        }

        var (username, password) = ((string, string))credentials!;
        try
        {
            try
            {
                await _store.FindUserByUsernameAsync(username, context.RequestAborted);
                return JsonStatus(StatusCodes.Status409Conflict, MessageDuplicateUser);
            }
            catch (UserNotFoundException)
            {
                // create below
            }

            var passwordHash = PasswordHasher.Hash(password);
            try
            {
                await _store.CreateUserAsync(username, passwordHash, context.RequestAborted);
            }
            catch (DuplicateUsernameException)
            {
                return JsonStatus(StatusCodes.Status409Conflict, MessageDuplicateUser);
            }

            return IssueToken(StatusCodes.Status201Created, username);
        }
        catch (Exception ex)
        {
            return ServerError(ex);
        }
    }

    public async Task<IResult> Login(HttpContext context)
    {
        var credentials = await ReadCredentials(context);
        if (credentials is IResult early)
        {
            return early;
        }

        var (username, password) = ((string, string))credentials!;
        try
        {
            User user;
            try
            {
                user = await _store.FindUserByUsernameAsync(username, context.RequestAborted);
            }
            catch (UserNotFoundException)
            {
                return JsonStatus(StatusCodes.Status401Unauthorized, MessageBadCredentials);
            }

            if (!PasswordHasher.Check(password, user.PasswordHash))
            {
                return JsonStatus(StatusCodes.Status401Unauthorized, MessageBadCredentials);
            }

            return IssueToken(StatusCodes.Status200OK, user.Username);
        }
        catch (Exception ex)
        {
            return ServerError(ex);
        }
    }

    public IResult Logout() => Results.NoContent();

    public IResult Me(HttpContext context)
    {
        var username = context.Items[UsernameItem] as string ?? "";
        return Results.Json(new ProfileResponse { Username = username });
    }

    public async Task<IResult> DeleteAccount(HttpContext context)
    {
        var username = context.Items[UsernameItem] as string ?? "";
        try
        {
            await _store.DeleteUserAsync(username, context.RequestAborted);
            return Results.NoContent();
        }
        catch (Exception ex)
        {
            return ServerError(ex);
        }
    }

    public async Task<IResult?> Authenticate(HttpContext context)
    {
        var header = context.Request.Headers[AuthHeader].ToString();
        if (!header.StartsWith(BearerPrefix, StringComparison.Ordinal))
        {
            return JsonStatus(StatusCodes.Status401Unauthorized, MessageUnauthorized);
        }

        string username;
        try
        {
            username = _tokens.Username(header[BearerPrefix.Length..]);
        }
        catch (InvalidTokenException)
        {
            return JsonStatus(StatusCodes.Status401Unauthorized, MessageUnauthorized);
        }

        try
        {
            await _store.FindUserByUsernameAsync(username, context.RequestAborted);
        }
        catch (UserNotFoundException)
        {
            return JsonStatus(StatusCodes.Status401Unauthorized, MessageUnauthorized);
        }
        catch (Exception ex)
        {
            return ServerError(ex);
        }

        context.Items[UsernameItem] = username;
        return null;
    }

    private IResult IssueToken(int status, string username)
    {
        try
        {
            var token = _tokens.Create(username);
            return Results.Json(
                new AuthResponse
                {
                    Token = token,
                    Username = username,
                    RedirectUrl = AppConfig.PostAuthRedirect,
                },
                statusCode: status);
        }
        catch (Exception ex)
        {
            return ServerError(ex);
        }
    }

    private IResult ServerError(Exception ex)
    {
        _logger.LogError(ex, "{Service}: {Message}", _serviceName, ex.Message);
        return JsonStatus(StatusCodes.Status500InternalServerError, MessageServerError);
    }

    private static IResult JsonStatus(int status, string message) =>
        Results.Json(new ErrorResponse { Message = message }, statusCode: status);

    private static async Task<object> ReadCredentials(HttpContext context)
    {
        Credentials? body;
        try
        {
            body = await JsonSerializer.DeserializeAsync<Credentials>(context.Request.Body, JsonOptions, context.RequestAborted);
        }
        catch (JsonException)
        {
            return JsonStatus(StatusCodes.Status400BadRequest, MessageInvalidJson);
        }

        if (body is null)
        {
            return JsonStatus(StatusCodes.Status400BadRequest, MessageInvalidJson);
        }

        var (username, password, message) = body.Validate();
        if (message.Length > 0)
        {
            return JsonStatus(StatusCodes.Status400BadRequest, message);
        }

        return (username, password);
    }
}
