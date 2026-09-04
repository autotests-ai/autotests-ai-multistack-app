using System.Text.RegularExpressions;

namespace Helpers;

public static class TokensCss
{
    private static readonly Regex RootBlock = new(@":root\s*\{([^}]+)\}", RegexOptions.Singleline | RegexOptions.Compiled);
    private static readonly Regex Token = new(@"(--[\w-]+)\s*:\s*([^;]+);", RegexOptions.Compiled);

    public static string DefaultTokensPath()
    {
        var module = Config.ConfigFiles.ModuleDir();
        return ResolveFromAppRoot(Path.GetFullPath(Path.Combine(module, "..", "..", "..")));
    }

    public static string ResolveFromAppRoot(string appRoot) =>
        FirstExisting(TokensCssCandidates(appRoot));

    public static string FirstExisting(params string[] candidates)
    {
        var fallback = Path.GetFullPath(candidates[^1]);
        foreach (var candidate in candidates)
        {
            var abs = Path.GetFullPath(candidate);
            if (File.Exists(abs))
            {
                return abs;
            }

            fallback = abs;
        }

        return fallback;
    }

    public static IReadOnlyDictionary<string, string> ParseRootTokens(string cssFile)
    {
        var css = File.ReadAllText(cssFile);
        var match = RootBlock.Match(css);
        if (!match.Success)
        {
            throw new ArgumentException($":root block not found in {cssFile}");
        }

        var tokens = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (Match token in Token.Matches(match.Groups[1].Value))
        {
            tokens[token.Groups[1].Value] = token.Groups[2].Value.Trim();
        }

        return tokens;
    }

    private static string[] TokensCssCandidates(string appRoot)
    {
        var candidates = new List<string> { HubTokens(appRoot) };
        AppendVendorTokens(Path.Combine(appRoot, "frontend"), candidates);
        return [.. candidates];
    }

    private static string HubTokens(string appRoot) =>
        Path.Combine(appRoot, "frontend", "_shared", "frontend-javascript-app", "css", "tokens.css");

    private static void AppendVendorTokens(string frontendRoot, List<string> output)
    {
        if (!Directory.Exists(frontendRoot))
        {
            return;
        }

        foreach (var lang in Directory.GetDirectories(frontendRoot).OrderBy(Path.GetFileName, StringComparer.Ordinal))
        {
            if (!IsProductLanguageDir(lang))
            {
                continue;
            }

            foreach (var cell in Directory.GetDirectories(lang).OrderBy(Path.GetFileName, StringComparer.Ordinal))
            {
                if (Path.GetFileName(cell).StartsWith('.'))
                {
                    continue;
                }

                output.Add(Path.Combine(cell, "vendor", "ds", "css", "tokens.css"));
                output.Add(Path.Combine(cell, "vendor", "frontend-javascript-app", "css", "tokens.css"));
            }
        }
    }

    private static bool IsProductLanguageDir(string path)
    {
        var name = Path.GetFileName(path);
        return !name.StartsWith('.') && !name.StartsWith('_') && name is not "scripts" and not "node_modules";
    }
}
