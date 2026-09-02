package tests

import (
	"fmt"
	"strings"
	"sync"
	"testing"
	"time"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/mxschmitt/playwright-go"
	"github.com/stretchr/testify/require"
)

const (
	sessionAttempts   = 3
	sessionRetryDelay = 3 * time.Second
)

var installOnce sync.Once

type Runtime struct {
	pw      *playwright.Playwright
	browser playwright.Browser
	context playwright.BrowserContext
	Page    playwright.Page
	App     *App
}

func WithApp(t *testing.T, a *allure.Context, fn func(*App)) {
	t.Helper()
	rt := StartRuntime(t, a)
	defer rt.Close()
	fn(rt.App)
}

func StartRuntime(t *testing.T, a *allure.Context) *Runtime {
	t.Helper()
	settings := LoadPlaywrightSettings()
	require.NoError(t, RequireChromium(settings.Browser))

	installOnce.Do(func() {
		_ = playwright.Install(&playwright.RunOptions{Browsers: []string{"chromium"}})
	})

	pw, err := playwright.Run()
	require.NoError(t, err)

	width, height := windowSize(settings.BrowserSize)
	remote := ResolveSelenoidURL(settings.RemoteURL)
	if IsHTTPURL(remote) {
		require.FailNow(t, fmt.Sprintf(
			"Playwright cannot use Selenoid WebDriver %s. Set SELENOID_PLAYWRIGHT_URL (wss://…/playwright/playwright-chromium/…).",
			DescribeRemote(remote),
		))
	}

	var browser playwright.Browser
	hub := IsWebSocket(remote)
	if hub {
		videoName := ""
		if settings.EnableVideo || settings.AttachVideo {
			videoName = "autotests-ai-multistack-go-pw-" + Username() + ".mp4"
		}
		ws := WithSessionQuery(remote, settings.EnableVNC, settings.EnableVideo || settings.AttachVideo, videoName, screenResolution(settings))
		browser = connectWithRetry(t, pw, ws)
	} else {
		opts := playwright.BrowserTypeLaunchOptions{
			Headless: playwright.Bool(settings.Headless),
			Args: []string{
				"--disable-gpu",
				"--no-sandbox",
				"--disable-dev-shm-usage",
				"--force-device-scale-factor=1",
			},
		}
		if settings.ChromeBinaryPath != "" {
			opts.ExecutablePath = playwright.String(settings.ChromeBinaryPath)
		}
		browser, err = pw.Chromium.Launch(opts)
		require.NoError(t, err)
	}

	base, err := ResolveBaseURL(LoadConfig())
	require.NoError(t, err)
	ctx, err := browser.NewContext(playwright.BrowserNewContextOptions{
		BaseURL:           playwright.String(base),
		Viewport:          &playwright.Size{Width: width, Height: height},
		DeviceScaleFactor: playwright.Float(1),
	})
	require.NoError(t, err)
	page, err := ctx.NewPage()
	require.NoError(t, err)
	page.SetDefaultTimeout(5_000)

	rt := &Runtime{pw: pw, browser: browser, context: ctx, Page: page, App: newApp(t, a, page)}
	return rt
}

func (rt *Runtime) Close() {
	if rt.context != nil {
		_ = rt.context.Close()
	}
	if rt.browser != nil {
		_ = rt.browser.Close()
	}
	if rt.pw != nil {
		_ = rt.pw.Stop()
	}
}

func connectWithRetry(t *testing.T, pw *playwright.Playwright, ws string) playwright.Browser {
	t.Helper()
	var last error
	for attempt := 1; attempt <= sessionAttempts; attempt++ {
		browser, err := pw.Chromium.Connect(ws, playwright.BrowserTypeConnectOptions{
			Timeout: playwright.Float(120_000),
		})
		if err == nil {
			return browser
		}
		last = err
		if attempt < sessionAttempts {
			time.Sleep(sessionRetryDelay)
		}
	}
	require.NoError(t, last)
	return nil
}

func windowSize(browserSize string) (int, int) {
	parts := strings.Split(strings.ToLower(browserSize), "x")
	if len(parts) != 2 {
		return 1740, 1080
	}
	var w, h int
	_, errW := fmt.Sscanf(strings.TrimSpace(parts[0]), "%d", &w)
	_, errH := fmt.Sscanf(strings.TrimSpace(parts[1]), "%d", &h)
	if errW != nil || errH != nil || w == 0 || h == 0 {
		return 1740, 1080
	}
	return w, h
}

func screenResolution(settings PlaywrightSettings) string {
	size := strings.TrimSpace(settings.BrowserSize)
	if size == "" {
		return "1920x1080x24"
	}
	parts := strings.Split(size, "x")
	if len(parts) < 2 {
		return "1920x1080x24"
	}
	return strings.TrimSpace(parts[0]) + "x" + strings.TrimSpace(parts[1]) + "x24"
}
