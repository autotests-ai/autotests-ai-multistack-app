package tests

import (
	"os"
	"strconv"
	"strings"
)

// PlaywrightSettings is the UI/e2e overlay on ConfigReader (Java TestConfig browser keys).
type PlaywrightSettings struct {
	Browser                  string
	BrowserVersion           string
	BrowserSize              string
	Headless                 bool
	RemoteURL                string
	ChromeBinaryPath         string
	EnableVNC                bool
	EnableVideo              bool
	EnableHAR                bool
	VideoFolder              string
	AttachBrowserConsoleLogs bool
	AttachHARLogs            bool
	AttachLastScreenshot     bool
	AttachPageSource         bool
	AttachVideo              bool
	WelcomeUsername          string
	UpdateScreenshots        bool
	ScreenshotsDir           string
	ScreenshotDiffThreshold  float64
}

func envBool(name string, defaultValue bool) bool {
	raw := strings.TrimSpace(os.Getenv(name))
	if raw == "" {
		return defaultValue
	}
	switch strings.ToLower(raw) {
	case "1", "true", "yes", "on":
		return true
	default:
		return false
	}
}

func envFloat(name string, defaultValue float64) float64 {
	raw := strings.TrimSpace(os.Getenv(name))
	if raw == "" {
		return defaultValue
	}
	n, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return defaultValue
	}
	return n
}

func welcomeUsername(stand string) string {
	if raw := strings.TrimSpace(os.Getenv("WELCOME_USERNAME")); raw != "" {
		return raw
	}
	if stand == "mock" {
		return "mock-user"
	}
	return "user1"
}

// LoadPlaywrightSettings reads browser / Selenoid / screenshot env (not ConfigReader).
func LoadPlaywrightSettings() PlaywrightSettings {
	stand := resolveStand()
	full := envBool("ATTACH_FULL", false)
	enableVideo := full || envBool("ENABLE_VIDEO", false)
	enableHAR := full || envBool("ENABLE_HAR", false)
	videoFolder := strings.TrimSpace(os.Getenv("VIDEO_FOLDER"))
	if videoFolder == "" {
		videoFolder = "https://selenoid.qa.guru/video/"
	}
	if !strings.HasSuffix(videoFolder, "/") {
		videoFolder += "/"
	}
	dir := strings.TrimSpace(os.Getenv("SCREENSHOTS_DIR"))
	if dir == "" {
		dir = "screenshots"
	}
	return PlaywrightSettings{
		Browser:                  firstNonEmpty(os.Getenv("BROWSER"), "chrome"),
		BrowserVersion:           firstNonEmpty(os.Getenv("BROWSER_VERSION"), "148.0"),
		BrowserSize:              firstNonEmpty(os.Getenv("BROWSER_SIZE"), "1740x1080"),
		Headless:                 envBool("HEADLESS", true),
		RemoteURL:                strings.TrimSpace(os.Getenv("SELENOID_PLAYWRIGHT_URL")),
		ChromeBinaryPath:         strings.TrimSpace(os.Getenv("CHROME_BINARY_PATH")),
		EnableVNC:                full || envBool("ENABLE_VNC", false),
		EnableVideo:              enableVideo,
		EnableHAR:                enableHAR,
		VideoFolder:              videoFolder,
		AttachBrowserConsoleLogs: full || envBool("ATTACH_BROWSER_CONSOLE_LOGS", false),
		AttachHARLogs:            full || envBool("ATTACH_HAR_LOGS", false) || enableHAR,
		AttachLastScreenshot:     full || envBool("ATTACH_LAST_SCREENSHOT", false),
		AttachPageSource:         full || envBool("ATTACH_PAGE_SOURCE", false),
		AttachVideo:              full || envBool("ATTACH_VIDEO", false) || enableVideo,
		WelcomeUsername:          welcomeUsername(stand),
		UpdateScreenshots:        envBool("UPDATE_SCREENSHOTS", false),
		ScreenshotsDir:           dir,
		ScreenshotDiffThreshold:  envFloat("SCREENSHOT_DIFF_THRESHOLD", 0.015),
	}
}
