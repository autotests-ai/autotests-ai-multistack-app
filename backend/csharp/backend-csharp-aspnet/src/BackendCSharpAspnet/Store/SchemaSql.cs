using System.Text;

namespace Dev.Multistack.App.Store;

/// <summary>
/// Splits schema.sql because Npgsql (like pgx) refuses more than one command per Execute.
/// </summary>
public static class SchemaSql
{
    public static string ReadFromOutput()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "schema.sql");
        return File.ReadAllText(path, Encoding.UTF8);
    }

    public static IReadOnlyList<string> SplitStatements(string schema)
    {
        var statements = new List<string>(4);
        foreach (var chunk in schema.Split(';'))
        {
            var statement = chunk.Trim();
            if (statement.Length > 0)
            {
                statements.Add(statement);
            }
        }

        return statements;
    }
}
