package infra_test

import (
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapSelenoid(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, tests.LayerInfraFrontend("Selenoid Playwright endpoint", "Test infra", "Selenoid Playwright endpoint", "normal")...)
}

func TestClassifiesSchemes(t *testing.T) {
	wrapSelenoid(t, "wss is a Playwright hub, https /wd/hub is not", func(a *allure.Context) {
		require.True(t, tests.IsWebSocket("wss://selenoid.example/playwright/playwright-chromium/1.61.1"))
		require.True(t, tests.IsHTTPURL("https://selenoid.example/wd/hub"))
		require.False(t, tests.IsWebSocket(""))
		require.False(t, tests.IsHTTPURL(""))
	})
}

func TestDescribeDropsQuery(t *testing.T) {
	wrapSelenoid(t, "describe strips query so accessKey never appears in logs", func(a *allure.Context) {
		raw := "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=secret"
		require.Equal(t, "wss://selenoid.example/playwright/playwright-chromium/1.61.1", tests.DescribeRemote(raw))
		require.NotContains(t, tests.DescribeRemote(raw), "secret")
	})
}

func TestEnvWebSocketWinsOverConfig(t *testing.T) {
	wrapSelenoid(t, "env WebSocket wins over truncated -DremoteUrl", func(a *allure.Context) {
		env := "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=x"
		truncated := "wss://selenoid.example/playwright/playwright-chromium/1.61.1"
		require.Equal(t, env, tests.PreferWebSocket(env, truncated))
		require.Equal(t, truncated, tests.PreferWebSocket("", truncated))
		require.Equal(t, "", tests.PreferWebSocket("", ""))
	})
}

func TestAppendsSessionQuery(t *testing.T) {
	wrapSelenoid(t, "session query is appended without dropping existing params", func(a *allure.Context) {
		ws := "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=x"
		out := tests.WithSessionQuery(ws, false, false, "", "")
		require.True(t, len(out) > len(ws) && out[:len(ws)+1] == ws+"&")
		require.Contains(t, out, "name=autotests-ai-multistack-go-pw")
		require.Contains(t, out, "sessionTimeout=5m")
		require.Contains(t, out, "enableVNC=false")
		require.Contains(t, out, "enableVideo=false")
	})
}

func TestRecordsVideoNameOnConnect(t *testing.T) {
	wrapSelenoid(t, "videoName and screenResolution go on the WS query when hub records", func(a *allure.Context) {
		ws := "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=x"
		out := tests.WithSessionQuery(ws, true, true, "go-pw-clip.mp4", "1920x1280x24")
		require.True(t, len(out) > len(ws) && out[:len(ws)+1] == ws+"&")
		require.Contains(t, out, "enableVideo=true")
		require.Contains(t, out, "enableVNC=true")
		require.Contains(t, out, "videoName=go-pw-clip.mp4")
		require.Contains(t, out, "screenResolution=1920x1280x24")
		require.Contains(t, out, "accessKey=x")
	})
}

func TestVideoURLJoinsFolderAndName(t *testing.T) {
	wrapSelenoid(t, "hub video URL is videoFolder + videoName", func(a *allure.Context) {
		require.Equal(t, "https://selenoid.qa.guru/video/go-pw-clip.mp4", tests.VideoURL("https://selenoid.qa.guru/video/", "go-pw-clip.mp4"))
		require.Equal(t, "https://selenoid.qa.guru/video/go-pw-clip.mp4", tests.VideoURL("https://selenoid.qa.guru/video", "go-pw-clip.mp4"))
		require.Equal(t, "", tests.VideoURL("", "clip.mp4"))
		require.Equal(t, "", tests.VideoURL("https://selenoid.qa.guru/video/", ""))
	})
}
