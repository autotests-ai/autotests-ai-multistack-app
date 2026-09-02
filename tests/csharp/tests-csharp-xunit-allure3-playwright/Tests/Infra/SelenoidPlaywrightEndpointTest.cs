using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Helpers;
using Tests;

namespace Tests.Infra;

[AllureLabel("layer", "infra")]
[AllureEpic("Test infra")]
[AllureFeature("Selenoid Playwright endpoint")]
[AllureSeverity(SeverityLevel.normal)]
[Trait("TestCategory", "infra")]
[Trait("TestCategory", "infra_frontend")]
[AllureSuite("Selenoid Playwright endpoint")]
public sealed class SelenoidPlaywrightEndpointTest : AllureMeta
{
    [Fact(DisplayName = "wss is a Playwright hub, https /wd/hub is not")]
    public void ClassifiesSchemes()
    {
        Assert.True(SelenoidPlaywrightEndpoint.IsWebSocket(
            "wss://selenoid.example/playwright/playwright-chromium/1.61.1"));
        Assert.True(SelenoidPlaywrightEndpoint.IsHttpUrl("https://selenoid.example/wd/hub"));
        Assert.False(SelenoidPlaywrightEndpoint.IsWebSocket(""));
        Assert.False(SelenoidPlaywrightEndpoint.IsHttpUrl(""));
    }

    [Fact(DisplayName = "describe strips query so accessKey never appears in logs")]
    public void DescribeDropsQuery()
    {
        var raw = "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=secret";
        Assert.Equal(
            "wss://selenoid.example/playwright/playwright-chromium/1.61.1",
            SelenoidPlaywrightEndpoint.Describe(raw));
        Assert.DoesNotContain("secret", SelenoidPlaywrightEndpoint.Describe(raw));
    }

    [Fact(DisplayName = "env WebSocket wins over truncated -DremoteUrl")]
    public void EnvWebSocketWinsOverConfig()
    {
        var env = "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=x";
        var truncated = "wss://selenoid.example/playwright/playwright-chromium/1.61.1";
        Assert.Equal(env, SelenoidPlaywrightEndpoint.PreferWebSocket(env, truncated));
        Assert.Equal(truncated, SelenoidPlaywrightEndpoint.PreferWebSocket("", truncated));
        Assert.Equal("", SelenoidPlaywrightEndpoint.PreferWebSocket("", ""));
    }

    [Fact(DisplayName = "session query is appended without dropping existing params")]
    public void AppendsSessionQuery()
    {
        var ws = "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=x";
        var output = SelenoidPlaywrightEndpoint.WithSessionQuery(ws, false, false);
        Assert.StartsWith(ws + "&", output);
        Assert.Contains("name=autotests-ai-multistack-csharp-pw", output);
        Assert.Contains("sessionTimeout=5m", output);
        Assert.Contains("enableVNC=false", output);
        Assert.Contains("enableVideo=false", output);
    }

    [Fact(DisplayName = "videoName and screenResolution go on the WS query when hub records")]
    public void RecordsVideoNameOnConnect()
    {
        var ws = "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=x";
        var output = SelenoidPlaywrightEndpoint.WithSessionQuery(
            ws, true, true, "csharp-pw-clip.mp4", "1920x1280x24");
        Assert.StartsWith(ws + "&", output);
        Assert.Contains("enableVideo=true", output);
        Assert.Contains("enableVNC=true", output);
        Assert.Contains("videoName=csharp-pw-clip.mp4", output);
        Assert.Contains("screenResolution=1920x1280x24", output);
        Assert.Contains("accessKey=x", output);
    }

    [Fact(DisplayName = "hub video URL is videoFolder + videoName")]
    public void VideoUrlJoinsFolderAndName()
    {
        Assert.Equal(
            "https://selenoid.qa.guru/video/csharp-pw-clip.mp4",
            SelenoidPlaywrightEndpoint.VideoUrl(
                "https://selenoid.qa.guru/video/", "csharp-pw-clip.mp4"));
        Assert.Equal(
            "https://selenoid.qa.guru/video/csharp-pw-clip.mp4",
            SelenoidPlaywrightEndpoint.VideoUrl(
                "https://selenoid.qa.guru/video", "csharp-pw-clip.mp4"));
        Assert.Equal("", SelenoidPlaywrightEndpoint.VideoUrl("", "clip.mp4"));
        Assert.Equal("", SelenoidPlaywrightEndpoint.VideoUrl("https://selenoid.qa.guru/video/", ""));
    }
}
