package infra_test

import (
	"strings"
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapConfig(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, tests.LayerInfra("ConfigReader", "Test infra", "ConfigReader", "normal")...)
}

func TestResolveBaseURLAddsTrailingSlash(t *testing.T) {
	wrapConfig(t, "resolveBaseUrl adds trailing slash to HTTP baseUrl", func(a *allure.Context) {
		url, err := tests.ResolveBaseURL(tests.TestConfig{BaseURL: "http://localhost:3000"})
		require.NoError(t, err)
		require.Equal(t, "http://localhost:3000/", url)
	})
}

func TestResolveBaseURLKeepsTrailingSlash(t *testing.T) {
	wrapConfig(t, "resolveBaseUrl keeps trailing slash on baseUrl", func(a *allure.Context) {
		url, err := tests.ResolveBaseURL(tests.TestConfig{BaseURL: "http://localhost:3000/"})
		require.NoError(t, err)
		require.Equal(t, "http://localhost:3000/", url)
	})
}

func TestResolveBaseURLFailsWhenEmpty(t *testing.T) {
	wrapConfig(t, "resolveBaseUrl fails fast when baseUrl is empty", func(a *allure.Context) {
		_, err := tests.ResolveBaseURL(tests.TestConfig{BaseURL: ""})
		require.Error(t, err)
		require.Contains(t, err.Error(), "Set baseUrl")
	})
}

func TestResolveAPIBaseURLAddsTrailingSlash(t *testing.T) {
	wrapConfig(t, "resolveApiBaseUrl adds trailing slash to HTTP apiBaseUrl", func(a *allure.Context) {
		url, err := tests.ResolveAPIBaseURL(tests.TestConfig{APIBaseURL: "http://api.example.com"})
		require.NoError(t, err)
		require.Equal(t, "http://api.example.com/", url)
	})
}

func TestResolveAPIBaseURLFailsWhenEmpty(t *testing.T) {
	wrapConfig(t, "resolveApiBaseUrl fails fast when apiBaseUrl is empty", func(a *allure.Context) {
		_, err := tests.ResolveAPIBaseURL(tests.TestConfig{APIBaseURL: ""})
		require.Error(t, err)
		require.Contains(t, err.Error(), "Set apiBaseUrl")
	})
}

func TestLoadedBaseURLHasNoTrailingSlash(t *testing.T) {
	wrapConfig(t, "loaded baseUrl has no trailing slash (Owner file; Ui.open uses resolveBaseUrl)", func(a *allure.Context) {
		t.Setenv("STAND", "ci")
		t.Setenv("ENV", "ci")
		t.Setenv("BASE_URL", "")
		t.Setenv("API_BASE_URL", "")
		cfg := tests.LoadConfig()
		require.Equal(t, "http://localhost:9821", cfg.BaseURL)
		require.False(t, strings.HasSuffix(cfg.BaseURL, "/"))
	})
}

func TestResolveBaseURLUsesLoadedConfig(t *testing.T) {
	wrapConfig(t, "resolveBaseUrl uses loaded config", func(a *allure.Context) {
		t.Setenv("STAND", "ci")
		t.Setenv("ENV", "ci")
		t.Setenv("BASE_URL", "")
		t.Setenv("API_BASE_URL", "")
		url, err := tests.ResolveBaseURL(tests.LoadConfig())
		require.NoError(t, err)
		require.Equal(t, "http://localhost:9821/", url)
	})
}

func TestResolveAPIBaseURLUsesLoadedConfig(t *testing.T) {
	wrapConfig(t, "resolveApiBaseUrl uses loaded config", func(a *allure.Context) {
		t.Setenv("STAND", "ci")
		t.Setenv("ENV", "ci")
		t.Setenv("BASE_URL", "")
		t.Setenv("API_BASE_URL", "")
		url, err := tests.ResolveAPIBaseURL(tests.LoadConfig())
		require.NoError(t, err)
		require.Equal(t, "http://localhost:8800/", url)
	})
}

func TestPrivateConstructorKeepsUtilityClassClosed(t *testing.T) {
	wrapConfig(t, "private constructor keeps utility class closed", func(a *allure.Context) {
		require.NotNil(t, tests.ClosedConfigReader())
	})
}
