using System.Reflection;
using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Config;
using Tests;

namespace Tests.Infra;

[AllureLabel("layer", "infra")]
[AllureEpic("Test infra")]
[AllureFeature("ConfigReader")]
[AllureSeverity(SeverityLevel.normal)]
[Trait("TestCategory", "infra")]
[Trait("TestCategory", "infra_backend")]
[AllureSuite("ConfigReader")]
public sealed class ConfigReaderTest : AllureMeta
{
    [Fact(DisplayName = "resolveBaseUrl adds trailing slash to HTTP baseUrl")]
    public void ResolveBaseUrlAddsTrailingSlash()
    {
        var config = ConfigReader.ConfigWith(new Dictionary<string, string> { ["baseUrl"] = "http://localhost:3000" });
        Assert.Equal("http://localhost:3000/", ConfigReader.ResolveBaseUrl(config));
    }

    [Fact(DisplayName = "resolveBaseUrl keeps trailing slash on baseUrl")]
    public void ResolveBaseUrlKeepsTrailingSlash()
    {
        var config = ConfigReader.ConfigWith(new Dictionary<string, string> { ["baseUrl"] = "http://localhost:3000/" });
        Assert.Equal("http://localhost:3000/", ConfigReader.ResolveBaseUrl(config));
    }

    [Fact(DisplayName = "resolveBaseUrl fails fast when baseUrl is empty")]
    public void ResolveBaseUrlFailsWhenEmpty()
    {
        var config = ConfigReader.ConfigWith(new Dictionary<string, string> { ["baseUrl"] = "" });
        var error = Assert.Throws<InvalidOperationException>(() => ConfigReader.ResolveBaseUrl(config));
        Assert.Contains("Set baseUrl", error!.Message);
    }

    [Fact(DisplayName = "resolveApiBaseUrl adds trailing slash to HTTP apiBaseUrl")]
    public void ResolveApiBaseUrlAddsTrailingSlash()
    {
        var config = ConfigReader.ConfigWith(new Dictionary<string, string> { ["apiBaseUrl"] = "http://api.example.com" });
        Assert.Equal("http://api.example.com/", ConfigReader.ResolveApiBaseUrl(config));
    }

    [Fact(DisplayName = "resolveApiBaseUrl fails fast when apiBaseUrl is empty")]
    public void ResolveApiBaseUrlFailsWhenEmpty()
    {
        var config = ConfigReader.ConfigWith(new Dictionary<string, string> { ["apiBaseUrl"] = "" });
        var error = Assert.Throws<InvalidOperationException>(() => ConfigReader.ResolveApiBaseUrl(config));
        Assert.Contains("Set apiBaseUrl", error!.Message);
    }

    [Fact(DisplayName = "loaded baseUrl has no trailing slash (Owner file; Ui.open uses resolveBaseUrl)")]
    public void LoadedBaseUrlHasNoTrailingSlash()
    {
        UsingCiStand(() =>
        {
            Assert.Equal("http://localhost:9821", ConfigReader.TestConfig.BaseUrl);
        });
    }

    [Fact(DisplayName = "resolveBaseUrl uses loaded config")]
    public void ResolveBaseUrlUsesLoadedConfig()
    {
        UsingCiStand(() =>
        {
            Assert.Equal("http://localhost:9821/", ConfigReader.ResolveBaseUrl());
        });
    }

    [Fact(DisplayName = "resolveApiBaseUrl uses loaded config")]
    public void ResolveApiBaseUrlUsesLoadedConfig()
    {
        UsingCiStand(() =>
        {
            Assert.Equal("http://localhost:8800/", ConfigReader.ResolveApiBaseUrl());
        });
    }

    [Fact(DisplayName = "private constructor keeps utility class closed")]
    public void PrivateConstructorIsReachable()
    {
        var ctor = typeof(ConfigReader).GetConstructor(BindingFlags.Instance | BindingFlags.NonPublic, Type.EmptyTypes);
        Assert.NotNull(ctor);
        Assert.NotNull(ctor!.Invoke(null));
        Assert.NotNull(ConfigReader.ClosedConfigReader());
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
