package tests

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// TestConfig is the Java TestConfig analog (HTTP-only: baseUrl + apiBaseUrl).
type TestConfig struct {
	Stand            string
	BaseURL          string
	APIBaseURL       string
	APIHealthService string
}

// ConfigReader is a closed helper (Java ConfigReader analog).
type ConfigReader struct{}

// ClosedConfigReader reaches the closed helper — Java private constructor analog.
func ClosedConfigReader() *ConfigReader {
	return &ConfigReader{}
}

// Same stands as java src/test/resources/config/{prod,stage,mock,ci}.properties.
// Stored values are Owner-file shape: baseUrl has no trailing slash; apiBaseUrl may.
var stands = map[string]TestConfig{
	"prod": {
		BaseURL:    "https://autotests.ai/stack/backend-java-spring/frontend-typescript-react",
		APIBaseURL: "https://autotests.ai/stack/backend-java-spring/",
	},
	"stage": {
		BaseURL:    "https://stage.autotests.ai/stack/backend-java-spring/frontend-typescript-react",
		APIBaseURL: "https://stage.autotests.ai/stack/backend-java-spring/",
	},
	"mock": {
		BaseURL:    "http://localhost:9911",
		APIBaseURL: "http://localhost:9911/",
	},
	"ci": {
		BaseURL:    "http://localhost:9821",
		APIBaseURL: "http://localhost:8800/",
	},
}

func init() {
	if strings.TrimSpace(os.Getenv("ALLURE_RESULTS_DIR")) != "" {
		return
	}
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		return
	}
	_ = os.Setenv("ALLURE_RESULTS_DIR", filepath.Join(filepath.Dir(file), "allure-results"))
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func withSlash(s string) string {
	if strings.HasSuffix(s, "/") {
		return s
	}
	return s + "/"
}

func resolveStand() string {
	raw := strings.ToLower(strings.TrimSpace(firstNonEmpty(os.Getenv("STAND"), os.Getenv("ENV"), "prod")))
	if _, ok := stands[raw]; ok {
		return raw
	}
	return "prod"
}

// LoadConfig reads STAND / BASE_URL / API_BASE_URL without slash-normalizing stored fields.
func LoadConfig() TestConfig {
	stand := resolveStand()
	defaults := stands[stand]
	base := firstNonEmpty(os.Getenv("BASE_URL"), defaults.BaseURL)
	api := firstNonEmpty(os.Getenv("API_BASE_URL"), defaults.APIBaseURL)
	return TestConfig{
		Stand:            stand,
		BaseURL:          base,
		APIBaseURL:       api,
		APIHealthService: firstNonEmpty(os.Getenv("API_HEALTH_SERVICE"), "backend-java-spring"),
	}
}

// ResolveBaseURL adds a trailing slash to HTTP baseUrl (Java ConfigReader.resolveBaseUrl).
func ResolveBaseURL(cfg TestConfig) (string, error) {
	url := strings.TrimSpace(cfg.BaseURL)
	if url == "" {
		return "", fmt.Errorf("Set baseUrl in config/${env}.properties")
	}
	return withSlash(url), nil
}

// ResolveAPIBaseURL adds a trailing slash to HTTP apiBaseUrl (Java ConfigReader.resolveApiBaseUrl).
func ResolveAPIBaseURL(cfg TestConfig) (string, error) {
	url := strings.TrimSpace(cfg.APIBaseURL)
	if url == "" {
		return "", fmt.Errorf("Set apiBaseUrl in config/${env}.properties")
	}
	return withSlash(url), nil
}

func mustAPIBaseURL() string {
	url, err := ResolveAPIBaseURL(LoadConfig())
	if err != nil {
		panic(err)
	}
	return url
}
