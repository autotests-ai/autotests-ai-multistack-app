package tests

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/mxschmitt/playwright-go"
	"github.com/stretchr/testify/require"
)

var (
	diffHighlight = color.RGBA{R: 255, B: 255, A: 255}
	sizeMismatch  = color.RGBA{R: 255, A: 255}
)

func ScreenshotMode(env string) (string, error) {
	key := strings.TrimSpace(env)
	switch key {
	case "mock":
		return "mock", nil
	case "stage":
		return "stage", nil
	case "prod", "ci", "":
		return "prod", nil
	default:
		return "", fmt.Errorf("screenshot folder: unknown env '%s' (use mock, stage, prod, or ci)", key)
	}
}

func ScreenshotOS() string {
	override := strings.TrimSpace(os.Getenv("SCREENSHOT_OS"))
	raw := override
	if raw == "" {
		raw = runtimeGOOS()
	}
	return mapScreenshotOS(raw)
}

func ScreenshotBrowser() string {
	if override := strings.TrimSpace(os.Getenv("SCREENSHOT_BROWSER")); override != "" {
		return strings.ToLower(override)
	}
	return "chrome"
}

func ScreenshotBrowserFolder() string {
	return ScreenshotBrowser() + "-" + majorVersion(PinnedChromeVersion())
}

func ScreenshotFilePath(area string, viewport int) string {
	cfg := LoadPlaywrightSettings()
	dir := strings.ReplaceAll(strings.Trim(cfg.ScreenshotsDir, "/\\"), "\\", "/")
	stand, err := ScreenshotMode(LoadConfig().Stand)
	if err != nil {
		panic(err)
	}
	return filepath.Join(
		moduleRoot(),
		dir,
		stand,
		ScreenshotOS(),
		ScreenshotBrowserFolder(),
		area,
		fmt.Sprintf("%d.png", viewport),
	)
}

func CaptureAndCompare(t *testing.T, a *allure.Context, locator playwright.Locator, area string, viewport int, attachmentName string) {
	t.Helper()
	page, err := locator.Page()
	require.NoError(t, err)
	waitForStableLayout(t, page)
	actual, err := locator.Screenshot()
	require.NoError(t, err)
	label := fmt.Sprintf("%s/%d", area, viewport)
	path := ScreenshotFilePath(area, viewport)
	present := fileExists(path)
	if LoadPlaywrightSettings().UpdateScreenshots {
		a.Step("Update screenshot: "+attachmentName, func(*allure.Context) {})
		require.NoError(t, os.MkdirAll(filepath.Dir(path), 0o755))
		require.NoError(t, os.WriteFile(path, actual, 0o644))
		return
	}
	if !present {
		require.Fail(t, fmt.Sprintf(
			"Screenshot missing for %s. Commit PNG to %s or run with UPDATE_SCREENSHOTS=true",
			label, path,
		))
	}
	expected, err := os.ReadFile(path)
	require.NoError(t, err)
	passed, _, message := compareImages(expected, actual, label)
	if !passed {
		require.Fail(t, message)
	}
}

func waitForStableLayout(t *testing.T, page playwright.Page) {
	t.Helper()
	_, err := page.Evaluate(`() => Promise.all([
		document.fonts.ready,
		new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
	])`)
	require.NoError(t, err)
}

func runtimeGOOS() string {
	return runtime.GOOS
}

func mapScreenshotOS(raw string) string {
	key := strings.ToLower(strings.TrimSpace(raw))
	switch {
	case key == "darwin" || key == "macos" || strings.HasPrefix(key, "mac"):
		return "macos"
	case key == "win32" || key == "windows" || strings.HasPrefix(key, "win"):
		return "windows"
	case key == "linux" || strings.Contains(key, "linux"):
		return "linux"
	case key == "":
		return "linux"
	default:
		return key
	}
}

func fileExists(path string) bool {
	st, err := os.Stat(path)
	return err == nil && !st.IsDir()
}

func compareImages(expectedBytes, actualBytes []byte, label string) (bool, []byte, string) {
	expected, err := decodeRGB(expectedBytes)
	if err != nil {
		return false, nil, err.Error()
	}
	actual, err := decodeRGB(actualBytes)
	if err != nil {
		return false, nil, err.Error()
	}
	diffPNG := createDiffPNG(expected, actual)
	if expected.Bounds().Dx() != actual.Bounds().Dx() || expected.Bounds().Dy() != actual.Bounds().Dy() {
		return false, diffPNG, fmt.Sprintf(
			"Screenshot size changed for %s: expected %dx%d, actual %dx%d",
			label, expected.Bounds().Dx(), expected.Bounds().Dy(), actual.Bounds().Dx(), actual.Bounds().Dy(),
		)
	}
	width, height := expected.Bounds().Dx(), expected.Bounds().Dy()
	diffPixels := 0
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if expected.RGBAAt(x, y) != actual.RGBAAt(x, y) {
				diffPixels++
			}
		}
	}
	total := width * height
	ratio := 1.0
	if total > 0 {
		ratio = float64(diffPixels) / float64(total)
	}
	maxDiff := LoadPlaywrightSettings().ScreenshotDiffThreshold
	if ratio > maxDiff {
		return false, diffPNG, fmt.Sprintf(
			"Screenshot diff too high for %s: %.2f%% > %.2f%%",
			label, ratio*100, maxDiff*100,
		)
	}
	return true, diffPNG, ""
}

func decodeRGB(data []byte) (*image.RGBA, error) {
	img, err := png.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("unsupported screenshot format: %w", err)
	}
	bounds := img.Bounds()
	out := image.NewRGBA(bounds)
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			out.Set(x, y, img.At(x, y))
		}
	}
	return out, nil
}

func createDiffPNG(expected, actual *image.RGBA) []byte {
	width := maxInt(expected.Bounds().Dx(), actual.Bounds().Dx())
	height := maxInt(expected.Bounds().Dy(), actual.Bounds().Dy())
	diff := image.NewRGBA(image.Rect(0, 0, width, height))
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			inExpected := x < expected.Bounds().Dx() && y < expected.Bounds().Dy()
			inActual := x < actual.Bounds().Dx() && y < actual.Bounds().Dy()
			if inExpected && inActual {
				exp := expected.RGBAAt(x, y)
				if exp == actual.RGBAAt(x, y) {
					diff.SetRGBA(x, y, dimRGB(exp))
				} else {
					diff.SetRGBA(x, y, diffHighlight)
				}
			} else {
				diff.SetRGBA(x, y, sizeMismatch)
			}
		}
	}
	var buf bytes.Buffer
	_ = png.Encode(&buf, diff)
	return buf.Bytes()
}

func dimRGB(c color.RGBA) color.RGBA {
	d := (int(c.R) + int(c.G) + int(c.B)) / 9
	return color.RGBA{R: uint8(d), G: uint8(d), B: uint8(d), A: 255}
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func SkipUnlessScreenshot(t *testing.T) {
	t.Helper()
	if strings.TrimSpace(os.Getenv("SCREENSHOT_BROWSER")) == "" {
		t.Skip("screenshot slice: set SCREENSHOT_BROWSER=chrome")
	}
}
