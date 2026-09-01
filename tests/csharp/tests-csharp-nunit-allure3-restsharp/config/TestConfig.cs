namespace Config;

/// <summary>Java TestConfig analog (HTTP-only: baseUrl + apiBaseUrl).</summary>
public sealed class TestConfig
{
    public string Stand { get; init; } = "prod";
    public string BaseUrl { get; init; } = "";
    public string ApiBaseUrl { get; init; } = "";
    public string ApiHealthService { get; init; } = "backend-java-spring";
    public bool EnableAllureRestAssuredListener { get; init; }
}
