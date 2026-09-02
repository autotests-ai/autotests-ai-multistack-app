using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Config;
using Helpers;
using Pages;

namespace Tests;

/// <summary>Shared Allure module/language labels for this tests slot (local and CI → TestOps).</summary>
[AllureOwner("stanislav")]
[AllureLabel("module", "tests-csharp-xunit-allure3-playwright")]
[AllureLabel("language", "csharp")]
[AllureLabel("framework", "playwright")]
public abstract class AllureMeta;

[AllureLabel("layer", "api")]
public abstract class ApiTestBase : AllureMeta
{
    protected static TestConfig Config { get; private set; } = null!;

    protected ApiTestBase()
    {
        Config = ConfigReader.LoadConfig();
        global::Api.RestSharpHttp.Setup(Config);
    }
}

/// <summary>Browser tests (ui + e2e). API tests stay on <see cref="ApiTestBase"/>.</summary>
[AllureLabel("scope", "browser")]
public abstract class TestBase : AllureMeta, IDisposable
{
    private readonly PlaywrightRuntime _runtime;

    protected readonly App App;
    protected LoginPage LoginPage => App.Login;
    protected HomePage HomePage => App.Home;
    protected RegisterPage RegisterPage => App.Register;

    protected static TestConfig Config { get; private set; } = null!;

    protected TestBase()
    {
        Config = ConfigReader.LoadConfig();
        global::Api.RestSharpHttp.Setup(Config);
        _runtime = new PlaywrightRuntime(Config);
        App = _runtime.App;
    }

    public virtual void Dispose()
    {
        if (Config.AttachBrowserConsoleLogs)
        {
            try
            {
                AllureApi.AddAttachment(
                    "Browser console",
                    "text/plain",
                    System.Text.Encoding.UTF8.GetBytes(_runtime.ConsoleText()));
            }
            catch (Exception)
            {
                // Allure context is optional
            }
        }

        _runtime.Dispose();
        GC.SuppressFinalize(this);
    }
}
