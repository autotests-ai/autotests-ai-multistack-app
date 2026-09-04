using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Helpers;
using Tests;

namespace Tests.Infra;

[AllureLabel("layer", "infra")]
[AllureEpic("Test infra")]
[AllureFeature("Tokens CSS")]
[AllureSeverity(SeverityLevel.normal)]
[Trait("TestCategory", "infra")]
[Trait("TestCategory", "infra_frontend")]
[AllureSuite("TokensCss")]
public sealed class TokensCssTest : AllureMeta
{
    [InlineData("--control-height-md", "36px")]
    [InlineData("--icon-size-md", "18px")]
    [InlineData("--input-min-width", "200px")]
    [InlineData("--header-height", "40px")]
    [Theory(DisplayName = "tokens.css keeps canonical component size tokens")]
    public void TokensMatchComponentSizesCanon(string token, string expected)
    {
        var tokens = TokensCss.ParseRootTokens(TokensCss.DefaultTokensPath());
        Assert.True(tokens.ContainsKey(token), "Missing token: " + token);
        Assert.Equal(expected, tokens[token]);
    }

    [Fact(DisplayName = "defaultTokensPath resolves an existing tokens.css")]
    public void DefaultTokensPathResolvesExistingFile()
    {
        Assert.True(File.Exists(TokensCss.DefaultTokensPath()));
    }

    [Fact(DisplayName = "firstExisting returns the first path that exists")]
    public void FirstExistingReturnsFirstHit()
    {
        var temp = Directory.CreateTempSubdirectory();
        try
        {
            var missing = Path.Combine(temp.FullName, "missing.css");
            var hit = Path.Combine(temp.FullName, "hit.css");
            var later = Path.Combine(temp.FullName, "later.css");
            File.WriteAllText(hit, ":root { --x: 1px; }");
            File.WriteAllText(later, ":root { --y: 2px; }");

            Assert.Equal(Path.GetFullPath(hit), TokensCss.FirstExisting(missing, hit, later));
        }
        finally
        {
            temp.Delete(true);
        }
    }

    [Fact(DisplayName = "firstExisting returns the last path when none exist")]
    public void FirstExistingReturnsLastWhenNoneExist()
    {
        var temp = Directory.CreateTempSubdirectory();
        try
        {
            var missing = Path.Combine(temp.FullName, "missing.css");
            var fallback = Path.Combine(temp.FullName, "fallback.css");

            Assert.Equal(Path.GetFullPath(fallback), TokensCss.FirstExisting(missing, fallback));
        }
        finally
        {
            temp.Delete(true);
        }
    }

    [Fact(DisplayName = "resolveFromAppRoot prefers the frontend hub over any vendor copy")]
    public void ResolveFromAppRootPrefersHub()
    {
        var temp = Directory.CreateTempSubdirectory();
        try
        {
            var hub = WriteTokens(Path.Combine(temp.FullName, "frontend", "_shared", "frontend-javascript-app", "css", "tokens.css"));
            WriteTokens(Path.Combine(temp.FullName, "frontend", "javascript", "frontend-javascript-vue", "vendor", "ds", "css", "tokens.css"));

            Assert.Equal(Path.GetFullPath(hub), TokensCss.ResolveFromAppRoot(temp.FullName));
        }
        finally
        {
            temp.Delete(true);
        }
    }

    [Fact(DisplayName = "resolveFromAppRoot finds vendor/ds on javascript-vue when hub is missing")]
    public void ResolveFromAppRootFindsVueVendorWhenHubMissing()
    {
        var temp = Directory.CreateTempSubdirectory();
        try
        {
            var vue = WriteTokens(Path.Combine(temp.FullName, "frontend", "javascript", "frontend-javascript-vue", "vendor", "ds", "css", "tokens.css"));

            Assert.Equal(Path.GetFullPath(vue), TokensCss.ResolveFromAppRoot(temp.FullName));
        }
        finally
        {
            temp.Delete(true);
        }
    }

    [Fact(DisplayName = "resolveFromAppRoot ignores scripts/.github/node_modules and uses a product cell")]
    public void ResolveFromAppRootSkipsNonProductFrontendDirs()
    {
        var temp = Directory.CreateTempSubdirectory();
        try
        {
            WriteTokens(Path.Combine(temp.FullName, "frontend", "scripts", "not-a-cell", "vendor", "ds", "css", "tokens.css"));
            WriteTokens(Path.Combine(temp.FullName, "frontend", ".github", "workflows", "vendor", "ds", "css", "tokens.css"));
            WriteTokens(Path.Combine(temp.FullName, "frontend", "node_modules", "pkg", "vendor", "ds", "css", "tokens.css"));
            WriteTokens(Path.Combine(temp.FullName, "frontend", "javascript", ".github", "vendor", "ds", "css", "tokens.css"));
            var vue = WriteTokens(Path.Combine(temp.FullName, "frontend", "javascript", "frontend-javascript-vue", "vendor", "ds", "css", "tokens.css"));

            Assert.Equal(Path.GetFullPath(vue), TokensCss.ResolveFromAppRoot(temp.FullName));
        }
        finally
        {
            temp.Delete(true);
        }
    }

    [Fact(DisplayName = "resolveFromAppRoot falls back to vendor/frontend-javascript-app when vendor/ds is missing")]
    public void ResolveFromAppRootFallsBackToVendoredApp()
    {
        var temp = Directory.CreateTempSubdirectory();
        try
        {
            var baked = WriteTokens(Path.Combine(
                temp.FullName, "frontend", "javascript", "frontend-javascript-vue",
                "vendor", "frontend-javascript-app", "css", "tokens.css"));

            Assert.Equal(Path.GetFullPath(baked), TokensCss.ResolveFromAppRoot(temp.FullName));
        }
        finally
        {
            temp.Delete(true);
        }
    }

    [Fact(DisplayName = "resolveFromAppRoot falls back to hub path when frontend tree is missing")]
    public void ResolveFromAppRootFallsBackToHubWhenFrontendMissing()
    {
        var temp = Directory.CreateTempSubdirectory();
        try
        {
            var hub = Path.Combine(temp.FullName, "frontend", "_shared", "frontend-javascript-app", "css", "tokens.css");

            Assert.Equal(Path.GetFullPath(hub), TokensCss.ResolveFromAppRoot(temp.FullName));
        }
        finally
        {
            temp.Delete(true);
        }
    }

    [Fact(DisplayName = "parseRootTokens rejects css without :root block")]
    public void ParseRootTokensRejectsMissingRootBlock()
    {
        var temp = Directory.CreateTempSubdirectory();
        try
        {
            var css = Path.Combine(temp.FullName, "tokens-invalid.css");
            File.WriteAllText(css, "body { color: red; }");

            var error = Assert.Throws<ArgumentException>(() => TokensCss.ParseRootTokens(css));
            Assert.Contains(":root block not found", error!.Message);
        }
        finally
        {
            temp.Delete(true);
        }
    }

    private static string WriteTokens(string file)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(file)!);
        File.WriteAllText(file, ":root { --x: 1px; }");
        return file;
    }
}
