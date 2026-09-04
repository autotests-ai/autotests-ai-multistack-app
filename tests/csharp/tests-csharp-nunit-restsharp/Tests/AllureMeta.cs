using Allure.NUnit;
using Allure.NUnit.Attributes;
using Config;

namespace Tests;

/// <summary>Shared Allure module/language labels for this tests slot (local and CI → TestOps).</summary>
[AllureNUnit]
[AllureOwner("stanislav")]
[AllureLabel("module", "tests-csharp-nunit-restsharp")]
[AllureLabel("language", "csharp")]
[AllureLabel("framework", "restsharp")]
public abstract class AllureMeta;

[AllureLabel("layer", "api")]
public abstract class ApiTestBase : AllureMeta
{
    protected static TestConfig Config { get; private set; } = null!;

    [OneTimeSetUp]
    public void SetupRestSharp()
    {
        Config = ConfigReader.LoadConfig();
        global::Api.RestSharpHttp.Setup(Config);
    }
}
