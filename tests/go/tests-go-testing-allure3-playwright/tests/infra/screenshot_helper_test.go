package infra_test

import (
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapShot(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, tests.LayerInfra("ScreenshotHelper", "Test infra", "ScreenshotHelper", "normal")...)
}

func TestScreenshotModeMapsEnvToStandFolder(t *testing.T) {
	cases := []struct{ env, folder string }{
		{"mock", "mock"},
		{"stage", "stage"},
		{"prod", "prod"},
		{"ci", "prod"},
		{"", "prod"},
	}
	wrapShot(t, "screenshotMode maps env to a stand folder", func(a *allure.Context) {
		for _, c := range cases {
			got, err := tests.ScreenshotMode(c.env)
			require.NoError(t, err, c.env)
			require.Equal(t, c.folder, got, c.env)
		}
	})
}

func TestScreenshotModeRejectsUnknownEnv(t *testing.T) {
	wrapShot(t, "screenshotMode rejects unknown env", func(a *allure.Context) {
		for _, env := range []string{"dev", "local", "multistack_ci"} {
			_, err := tests.ScreenshotMode(env)
			require.Error(t, err, env)
			require.Contains(t, err.Error(), "unknown env")
		}
	})
}

func TestScreenshotOSMapsOverride(t *testing.T) {
	t.Setenv("SCREENSHOT_OS", "darwin")
	require.Equal(t, "macos", tests.ScreenshotOS())
	t.Setenv("SCREENSHOT_OS", "linux")
	require.Equal(t, "linux", tests.ScreenshotOS())
	t.Setenv("SCREENSHOT_OS", "win32")
	require.Equal(t, "windows", tests.ScreenshotOS())
}
