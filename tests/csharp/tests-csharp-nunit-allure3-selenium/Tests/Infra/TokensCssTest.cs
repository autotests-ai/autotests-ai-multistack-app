using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Helpers;
using Tests;

namespace Tests.Infra;

[AllureLabel("layer", "infra")]
[AllureEpic("Test infra")]
[AllureFeature("Tokens CSS")]
[AllureSeverity(SeverityLevel.normal)]
[Category("infra")]
[Category("infra_frontend")]
[AllureSuite("TokensCss")]
public sealed class TokensCssTest : AllureMeta
{
    [TestCase("--control-height-md", "36px")]
    [TestCase("--icon-size-md", "18px")]
    [TestCase("--input-min-width", "200px")]
    [TestCase("--header-height", "40px")]
    [AllureName("tokens.css keeps canonical component size tokens")]
    public void TokensMatchComponentSizesCanon(string token, string expected)
    {
        var tokens = TokensCss.ParseRootTokens(TokensCss.DefaultTokensPath());
        Assert.That(tokens.ContainsKey(token), Is.True, "Missing token: " + token);
        Assert.That(tokens[token], Is.EqualTo(expected));
    }

    [Test]
    [AllureName("defaultTokensPath resolves an existing tokens.css")]
    public void DefaultTokensPathResolvesExistingFile()
    {
        Assert.That(File.Exists(TokensCss.DefaultTokensPath()), Is.True);
    }

    [Test]
    [AllureName("firstExisting returns the first path that exists")]
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

            Assert.That(TokensCss.FirstExisting(missing, hit, later), Is.EqualTo(Path.GetFullPath(hit)));
        }
        finally
        {
            temp.Delete(true);
        }
    }

    [Test]
    [AllureName("firstExisting returns the last path when none exist")]
    public void FirstExistingReturnsLastWhenNoneExist()
    {
        var temp = Directory.CreateTempSubdirectory();
        try
        {
            var missing = Path.Combine(temp.FullName, "missing.css");
            var fallback = Path.Combine(temp.FullName, "fallback.css");

            Assert.That(TokensCss.FirstExisting(missing, fallback), Is.EqualTo(Path.GetFullPath(fallback)));
        }
        finally
        {
            temp.Delete(true);
        }
    }

    [Test]
    [AllureName("resolveFromAppRoot prefers the frontend hub over any vendor copy")]
    public void ResolveFromAppRootPrefersHub()
    {
        var temp = Directory.CreateTempSubdirectory();
        try
        {
            var hub = WriteTokens(Path.Combine(temp.FullName, "frontend", "_shared", "frontend-javascript-app", "css", "tokens.css"));
            WriteTokens(Path.Combine(temp.FullName, "frontend", "javascript", "frontend-javascript-vue", "vendor", "ds", "css", "tokens.css"));

            Assert.That(TokensCss.ResolveFromAppRoot(temp.FullName), Is.EqualTo(Path.GetFullPath(hub)));
        }
        finally
        {
            temp.Delete(true);
        }
    }

    [Test]
    [AllureName("resolveFromAppRoot finds vendor/ds on javascript-vue when hub is missing")]
    public void ResolveFromAppRootFindsVueVendorWhenHubMissing()
    {
        var temp = Directory.CreateTempSubdirectory();
        try
        {
            var vue = WriteTokens(Path.Combine(temp.FullName, "frontend", "javascript", "frontend-javascript-vue", "vendor", "ds", "css", "tokens.css"));

            Assert.That(TokensCss.ResolveFromAppRoot(temp.FullName), Is.EqualTo(Path.GetFullPath(vue)));
        }
        finally
        {
            temp.Delete(true);
        }
    }

    [Test]
    [AllureName("resolveFromAppRoot ignores scripts/.github/node_modules and uses a product cell")]
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

            Assert.That(TokensCss.ResolveFromAppRoot(temp.FullName), Is.EqualTo(Path.GetFullPath(vue)));
        }
        finally
        {
            temp.Delete(true);
        }
    }

    [Test]
    [AllureName("resolveFromAppRoot falls back to vendor/frontend-javascript-app when vendor/ds is missing")]
    public void ResolveFromAppRootFallsBackToVendoredApp()
    {
        var temp = Directory.CreateTempSubdirectory();
        try
        {
            var baked = WriteTokens(Path.Combine(
                temp.FullName, "frontend", "javascript", "frontend-javascript-vue",
                "vendor", "frontend-javascript-app", "css", "tokens.css"));

            Assert.That(TokensCss.ResolveFromAppRoot(temp.FullName), Is.EqualTo(Path.GetFullPath(baked)));
        }
        finally
        {
            temp.Delete(true);
        }
    }

    [Test]
    [AllureName("resolveFromAppRoot falls back to hub path when frontend tree is missing")]
    public void ResolveFromAppRootFallsBackToHubWhenFrontendMissing()
    {
        var temp = Directory.CreateTempSubdirectory();
        try
        {
            var hub = Path.Combine(temp.FullName, "frontend", "_shared", "frontend-javascript-app", "css", "tokens.css");

            Assert.That(TokensCss.ResolveFromAppRoot(temp.FullName), Is.EqualTo(Path.GetFullPath(hub)));
        }
        finally
        {
            temp.Delete(true);
        }
    }

    [Test]
    [AllureName("parseRootTokens rejects css without :root block")]
    public void ParseRootTokensRejectsMissingRootBlock()
    {
        var temp = Directory.CreateTempSubdirectory();
        try
        {
            var css = Path.Combine(temp.FullName, "tokens-invalid.css");
            File.WriteAllText(css, "body { color: red; }");

            var error = Assert.Throws<ArgumentException>(() => TokensCss.ParseRootTokens(css));
            Assert.That(error!.Message, Does.Contain(":root block not found"));
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
