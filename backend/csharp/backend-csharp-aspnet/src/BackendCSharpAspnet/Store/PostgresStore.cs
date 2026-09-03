using Npgsql;

namespace Dev.Multistack.App.Store;

/// <summary>Production store. Handlers never depend on this type, only on <see cref="IStore"/>.</summary>
public sealed class PostgresStore : IStore, IAsyncDisposable
{
    public const string UniqueViolationCode = "23505";

    private readonly NpgsqlDataSource _dataSource;

    private PostgresStore(NpgsqlDataSource dataSource)
    {
        _dataSource = dataSource;
    }

    public static PostgresStore Open(string databaseUrl)
    {
        var builder = new NpgsqlConnectionStringBuilder(ToNpgsqlConnectionString(databaseUrl))
        {
            MaxPoolSize = 10,
        };
        return new PostgresStore(NpgsqlDataSource.Create(builder));
    }

    public async Task WaitReadyAsync(TimeSpan timeout, CancellationToken cancellationToken)
    {
        var deadline = DateTime.UtcNow + timeout;
        var attempt = 0;
        while (true)
        {
            attempt++;
            try
            {
                await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
                await using var command = new NpgsqlCommand("SELECT 1", connection);
                await command.ExecuteScalarAsync(cancellationToken);
                return;
            }
            catch (Exception ex) when (DateTime.UtcNow < deadline)
            {
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(1), cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    throw new InvalidOperationException($"database not ready after {attempt} attempts: {ex.Message}", ex);
                }
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"database not ready after {attempt} attempts: {ex.Message}", ex);
            }
        }
    }

    public async Task ApplySchemaAsync(string schema, CancellationToken cancellationToken)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        foreach (var statement in SchemaSql.SplitStatements(schema))
        {
            await using var command = new NpgsqlCommand(statement, connection);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    public async Task<IReadOnlyList<Item>> ListItemsAsync(CancellationToken cancellationToken)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            "SELECT id, name, description FROM items ORDER BY id",
            connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var items = new List<Item>(8);
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new Item(reader.GetInt64(0), reader.GetString(1), reader.GetString(2)));
        }

        return items;
    }

    public async Task<long> CountItemsAsync(CancellationToken cancellationToken)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("SELECT COUNT(*) FROM items", connection);
        var result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt64(result);
    }

    public async Task InsertItemAsync(string name, string description, CancellationToken cancellationToken)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            "INSERT INTO items (name, description) VALUES ($1, $2)",
            connection);
        command.Parameters.AddWithValue(name);
        command.Parameters.AddWithValue(description);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<User> FindUserByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            "SELECT id, username, password_hash FROM users WHERE username = $1",
            connection);
        command.Parameters.AddWithValue(username);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new UserNotFoundException();
        }

        return new User(reader.GetInt64(0), reader.GetString(1), reader.GetString(2));
    }

    public async Task<User> CreateUserAsync(string username, string passwordHash, CancellationToken cancellationToken)
    {
        try
        {
            await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
            await using var command = new NpgsqlCommand(
                "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id",
                connection);
            command.Parameters.AddWithValue(username);
            command.Parameters.AddWithValue(passwordHash);
            var id = Convert.ToInt64(await command.ExecuteScalarAsync(cancellationToken));
            return new User(id, username, passwordHash);
        }
        catch (Exception ex) when (IsUniqueViolation(ex))
        {
            throw new DuplicateUsernameException();
        }
    }

    public async Task DeleteUserAsync(string username, CancellationToken cancellationToken)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("DELETE FROM users WHERE username = $1", connection);
        command.Parameters.AddWithValue(username);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public ValueTask DisposeAsync() => _dataSource.DisposeAsync();

    internal static bool IsUniqueViolation(Exception? error)
    {
        for (var current = error; current != null; current = current.InnerException)
        {
            if (current is PostgresException pg && pg.SqlState == UniqueViolationCode)
            {
                return true;
            }
        }

        return false;
    }

    internal static string ToNpgsqlConnectionString(string databaseUrl)
    {
        if (databaseUrl.StartsWith("postgres://", StringComparison.Ordinal) ||
            databaseUrl.StartsWith("postgresql://", StringComparison.Ordinal))
        {
            var uri = new Uri(databaseUrl);
            var userInfo = uri.UserInfo.Split(':', 2);
            var user = Uri.UnescapeDataString(userInfo[0]);
            var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
            var db = uri.AbsolutePath.Trim('/');
            var sslMode = "Disable";
            var query = uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries);
            foreach (var part in query)
            {
                var pair = part.Split('=', 2);
                if (pair[0] == "sslmode" && pair.Length == 2 && pair[1] == "disable")
                {
                    sslMode = "Disable";
                }
            }

            return $"Host={uri.Host};Port={uri.Port};Username={user};Password={password};Database={db};SSL Mode={sslMode}";
        }

        return databaseUrl;
    }
}
