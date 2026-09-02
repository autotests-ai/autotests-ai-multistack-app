package tests

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

func moduleRoot() string {
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		return "."
	}
	return filepath.Dir(file)
}

func PinnedChromeVersion() string {
	if override := strings.TrimSpace(os.Getenv("CHROME_FOR_TESTING_VERSION")); override != "" {
		return override
	}
	pin := filepath.Join(moduleRoot(), "chrome-for-testing.properties")
	raw, err := os.ReadFile(pin)
	if err != nil {
		panic(fmt.Errorf("chrome-for-testing.properties is missing: %s", pin))
	}
	for _, line := range strings.Split(string(raw), "\n") {
		stripped := strings.TrimSpace(line)
		if strings.HasPrefix(stripped, "version=") {
			value := strings.TrimSpace(strings.TrimPrefix(stripped, "version="))
			if value != "" {
				return value
			}
		}
	}
	panic("No version= entry in chrome-for-testing.properties")
}

func majorVersion(version string) string {
	parts := strings.Split(version, ".")
	if len(parts) == 0 {
		return version
	}
	return parts[0]
}

// ApplyChromePin rejects a blank or foreign-major browserVersion (Java LocalChromePin.apply).
func ApplyChromePin(browserVersion string) error {
	if strings.TrimSpace(browserVersion) == "" {
		return fmt.Errorf("browserVersion is required for local Chrome (canon: 148). Do not run e2e on system Chrome without explicit override.")
	}
	pin := PinnedChromeVersion()
	if majorVersion(browserVersion) != majorVersion(pin) {
		return fmt.Errorf("pinned build is %s; refusing browserVersion %s", pin, browserVersion)
	}
	return nil
}

func RequireChromium(browser string) error {
	key := strings.ToLower(strings.TrimSpace(browser))
	if key != "chrome" && key != "chromium" {
		return fmt.Errorf("This Playwright cell is Chromium-only: local Chrome for Testing, or Selenoid wss://…/playwright-chromium/…. Got browser=%s", browser)
	}
	return nil
}
