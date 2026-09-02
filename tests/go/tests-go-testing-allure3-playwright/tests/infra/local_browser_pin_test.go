package infra_test

import (
	"regexp"
	"strconv"
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapPin(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, tests.LayerInfraFrontend("Local browser pin", "Test infra", "Local browser pin", "normal")...)
}

func TestPinnedVersionIsFullChromeForTestingBuildNumber(t *testing.T) {
	wrapPin(t, "pinnedVersion is a full Chrome for Testing build number", func(a *allure.Context) {
		require.Regexp(t, regexp.MustCompile(`^\d+\.\d+\.\d+\.\d+$`), tests.PinnedChromeVersion())
	})
}

func TestConfiguredBrowserVersionStaysOnThePinnedMajor(t *testing.T) {
	wrapPin(t, "configured browserVersion stays on the pinned major", func(a *allure.Context) {
		pinMajor := splitMajor(tests.PinnedChromeVersion())
		cfgMajor := splitMajor(tests.LoadPlaywrightSettings().BrowserVersion)
		require.Equal(t, pinMajor, cfgMajor)
	})
}

func TestApplyRejectsForeignMajor(t *testing.T) {
	wrapPin(t, "apply rejects a browserVersion from another major", func(a *allure.Context) {
		major, err := strconv.Atoi(splitMajor(tests.PinnedChromeVersion()))
		require.NoError(t, err)
		err = tests.ApplyChromePin(strconv.Itoa(major + 1))
		require.Error(t, err)
		require.Contains(t, err.Error(), "pinned build is")
	})
}

func TestApplyRefusesToFallBackToSystemChrome(t *testing.T) {
	wrapPin(t, "apply refuses to fall back to system Chrome", func(a *allure.Context) {
		err := tests.ApplyChromePin(" ")
		require.Error(t, err)
		require.Contains(t, err.Error(), "browserVersion is required")
	})
}

func TestRuntimeRejectsANonChromiumBrowser(t *testing.T) {
	wrapPin(t, "runtime rejects a non-Chromium browser", func(a *allure.Context) {
		err := tests.RequireChromium("firefox")
		require.Error(t, err)
		require.Contains(t, err.Error(), "Chromium-only")
	})
}

func splitMajor(version string) string {
	for i, ch := range version {
		if ch == '.' {
			return version[:i]
		}
	}
	return version
}
