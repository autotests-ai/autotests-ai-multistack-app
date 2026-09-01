using System.Reflection;
using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Config;
using Tests;

namespace Tests.Infra;

[AllureLabel("layer", "infra")]
[AllureEpic("Test infra")]
[AllureFeature("ConfigReader")]
[AllureSeverity(SeverityLevel.normal)]
[Category("infra")]
[Category("infra_backend")]
[AllureSuite("ConfigReader")]
[NonParallelizable]
public sealed class ConfigReaderTest : AllureMeta
{
    [Test]
    [AllureName("resolveBaseUrl adds trailing slash to HTTP baseUrl")]
    public void ResolveBaseUrlAddsTrailingSlash()
    {
        var config = ConfigReader.ConfigWith(new Dictionary<string, string> { ["baseUrl"] = "http://localhost:3000" });
        Assert.That(ConfigReader.ResolveBaseUrl(config), Is.EqualTo("http://localhost:3000/"));
    }

    [Test]
    [AllureName("resolveBaseUrl keeps trailing slash on baseUrl")]
    public void ResolveBaseUrlKeepsTrailingSlash()
    {
        var config = ConfigReader.ConfigWith(new Dictionary<string, string> { ["baseUrl"] = "http://localhost:3000/" });
        Assert.That(ConfigReader.ResolveBaseUrl(config), Is.EqualTo("http://localhost:3000/"));
    }

    [Test]
    [AllureName("resolveBaseUrl fails fast when baseUrl is empty")]
    public void ResolveBaseUrlFailsWhenEmpty()
    {
        var config = ConfigReader.ConfigWith(new Dictionary<string, string> { ["baseUrl"] = "" });
        var error = Assert.Throws<InvalidOperationException>(() => ConfigReader.ResolveBaseUrl(config));
        Assert.That(error!.Message, Does.Contain("Set baseUrl"));
    }

    [Test]
    [AllureName("resolveApiBaseUrl adds trailing slash to HTTP apiBaseUrl")]
    public void ResolveApiBaseUrlAddsTrailingSlash()
    {
        var config = ConfigReader.ConfigWith(new Dictionary<string, string> { ["apiBaseUrl"] = "http://api.example.com" });
        Assert.That(ConfigReader.ResolveApiBaseUrl(config), Is.EqualTo("http://api.example.com/"));
    }

    [Test]
    [AllureName("resolveApiBaseUrl fails fast when apiBaseUrl is empty")]
    public void ResolveApiBaseUrlFailsWhenEmpty()
    {
        var config = ConfigReader.ConfigWith(new Dictionary<string, string> { ["apiBaseUrl"] = "" });
        var error = Assert.Throws<InvalidOperationException>(() => ConfigReader.ResolveApiBaseUrl(config));
        Assert.That(error!.Message, Does.Contain("Set apiBaseUrl"));
    }

    [Test]
    [AllureName("loaded baseUrl has no trailing slash (Owner file; Ui.open uses resolveBaseUrl)")]
    public void LoadedBaseUrlHasNoTrailingSlash()
    {
        UsingCiStand(() =>
        {
            Assert.That(ConfigReader.LoadConfig().BaseUrl, Is.EqualTo("http://localhost:9821"));
        });
    }

    [Test]
    [AllureName("resolveBaseUrl uses loaded config")]
    public void ResolveBaseUrlUsesLoadedConfig()
    {
        UsingCiStand(() =>
        {
            Assert.That(ConfigReader.ResolveBaseUrl(ConfigReader.LoadConfig()), Is.EqualTo("http://localhost:9821/"));
        });
    }

    [Test]
    [AllureName("resolveApiBaseUrl uses loaded config")]
    public void ResolveApiBaseUrlUsesLoadedConfig()
    {
        UsingCiStand(() =>
        {
            Assert.That(ConfigReader.ResolveApiBaseUrl(ConfigReader.LoadConfig()), Is.EqualTo("http://localhost:8800/"));
        });
    }

    [Test]
    [AllureName("private constructor keeps utility class closed")]
    public void PrivateConstructorIsReachable()
    {
        var ctor = typeof(ConfigReader).GetConstructor(BindingFlags.Instance | BindingFlags.NonPublic, Type.EmptyTypes);
        Assert.That(ctor, Is.Not.Null);
        Assert.That(ctor!.Invoke(null), Is.Not.Null);
        Assert.That(ConfigReader.ClosedConfigReader(), Is.Not.Null);
    }

    private static void UsingCiStand(Action body)
    {
        var previous = Snapshot(["STAND", "ENV", "BASE_URL", "API_BASE_URL"]);
        try
        {
            Environment.SetEnvironmentVariable("STAND", "ci");
            Environment.SetEnvironmentVariable("ENV", "ci");
            Environment.SetEnvironmentVariable("BASE_URL", "");
            Environment.SetEnvironmentVariable("API_BASE_URL", "");
            body();
        }
        finally
        {
            Restore(previous);
        }
    }

    private static Dictionary<string, string?> Snapshot(IEnumerable<string> keys) =>
        keys.ToDictionary(key => key, Environment.GetEnvironmentVariable);

    private static void Restore(Dictionary<string, string?> previous)
    {
        foreach (var (key, value) in previous)
        {
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}
