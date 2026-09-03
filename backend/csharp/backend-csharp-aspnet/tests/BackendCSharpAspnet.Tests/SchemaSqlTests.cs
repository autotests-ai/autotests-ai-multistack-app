using Dev.Multistack.App.Store;
using Xunit;

namespace BackendCSharpAspnet.Tests;

public sealed class SchemaSqlTests
{
    [Fact]
    public void SplitStatements()
    {
        var statements = SchemaSql.SplitStatements("""
            CREATE TABLE IF NOT EXISTS items (
                id BIGSERIAL PRIMARY KEY
            );

            CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
            """);
        Assert.Equal(2, statements.Count);
        Assert.Equal("CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)", statements[1]);
    }

    [Fact]
    public void SplitStatementsIgnoresBlanks()
    {
        Assert.Empty(SchemaSql.SplitStatements("  \n ; ;\n"));
    }

    [Fact]
    public void IsUniqueViolation()
    {
        Assert.False(PostgresStore.IsUniqueViolation(null));
        Assert.False(PostgresStore.IsUniqueViolation(new InvalidOperationException("boom")));
        Assert.False(PostgresStore.IsUniqueViolation(new Exception("wrap", new InvalidOperationException("inner"))));
    }

    [Fact]
    public void ToNpgsqlConnectionStringFromUrl()
    {
        var dsn = PostgresStore.ToNpgsqlConnectionString(
            "postgres://someone:p%40ss%20word@postgres:55440/other_db?sslmode=disable");
        Assert.Contains("Host=postgres", dsn);
        Assert.Contains("Port=55440", dsn);
        Assert.Contains("Username=someone", dsn);
        Assert.Contains("Password=p@ss word", dsn);
        Assert.Contains("Database=other_db", dsn);
        Assert.Contains("SSL Mode=Disable", dsn);
    }
}
