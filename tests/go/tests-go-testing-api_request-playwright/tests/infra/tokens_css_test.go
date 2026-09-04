package infra_test

import (
	"os"
	"path/filepath"
	"testing"

	tests "tests-go-testing-api_request-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapTokens(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, tests.LayerInfraFrontend("TokensCss", "Test infra", "Tokens CSS", "normal")...)
}

func writeTokens(t *testing.T, path string) string {
	t.Helper()
	require.NoError(t, os.MkdirAll(filepath.Dir(path), 0o755))
	require.NoError(t, os.WriteFile(path, []byte(":root { --x: 1px; }"), 0o644))
	abs, err := filepath.Abs(path)
	require.NoError(t, err)
	return abs
}

func TestTokensCSSKeepsCanonicalComponentSizeTokens(t *testing.T) {
	wrapTokens(t, "tokens.css keeps canonical component size tokens", func(a *allure.Context) {
		tokens, err := tests.ParseRootTokens(tests.DefaultTokensPath())
		require.NoError(t, err)
		require.Equal(t, "36px", tokens["--control-height-md"])
		require.Equal(t, "18px", tokens["--icon-size-md"])
		require.Equal(t, "200px", tokens["--input-min-width"])
		require.Equal(t, "40px", tokens["--header-height"])
	})
}

func TestDefaultTokensPathResolvesAnExistingTokensCSS(t *testing.T) {
	wrapTokens(t, "defaultTokensPath resolves an existing tokens.css", func(a *allure.Context) {
		st, err := os.Stat(tests.DefaultTokensPath())
		require.NoError(t, err)
		require.False(t, st.IsDir())
	})
}

func TestFirstExistingReturnsTheFirstPathThatExists(t *testing.T) {
	wrapTokens(t, "firstExisting returns the first path that exists", func(a *allure.Context) {
		dir := t.TempDir()
		missing := filepath.Join(dir, "missing.css")
		hit := writeTokens(t, filepath.Join(dir, "hit.css"))
		later := writeTokens(t, filepath.Join(dir, "later.css"))
		require.Equal(t, hit, tests.FirstExisting(missing, hit, later))
	})
}

func TestFirstExistingReturnsTheLastPathWhenNoneExist(t *testing.T) {
	wrapTokens(t, "firstExisting returns the last path when none exist", func(a *allure.Context) {
		dir := t.TempDir()
		missing := filepath.Join(dir, "missing.css")
		fallback := filepath.Join(dir, "fallback.css")
		abs, err := filepath.Abs(fallback)
		require.NoError(t, err)
		require.Equal(t, abs, tests.FirstExisting(missing, fallback))
	})
}

func TestResolveFromAppRootPrefersTheFrontendHub(t *testing.T) {
	wrapTokens(t, "resolveFromAppRoot prefers the frontend hub over any vendor copy", func(a *allure.Context) {
		root := t.TempDir()
		hub := writeTokens(t, filepath.Join(root, "frontend", "_shared", "frontend-javascript-app", "css", "tokens.css"))
		writeTokens(t, filepath.Join(root, "frontend", "javascript", "frontend-javascript-vue", "vendor", "ds", "css", "tokens.css"))
		require.Equal(t, hub, tests.ResolveFromAppRoot(root))
	})
}

func TestResolveFromAppRootFindsVendorDSOnJavascriptVue(t *testing.T) {
	wrapTokens(t, "resolveFromAppRoot finds vendor/ds on javascript-vue when hub is missing", func(a *allure.Context) {
		root := t.TempDir()
		vue := writeTokens(t, filepath.Join(root, "frontend", "javascript", "frontend-javascript-vue", "vendor", "ds", "css", "tokens.css"))
		require.Equal(t, vue, tests.ResolveFromAppRoot(root))
	})
}

func TestResolveFromAppRootIgnoresScriptsGithubNodeModules(t *testing.T) {
	wrapTokens(t, "resolveFromAppRoot ignores scripts/.github/node_modules and uses a product cell", func(a *allure.Context) {
		root := t.TempDir()
		writeTokens(t, filepath.Join(root, "frontend", "scripts", "not-a-cell", "vendor", "ds", "css", "tokens.css"))
		writeTokens(t, filepath.Join(root, "frontend", ".github", "workflows", "vendor", "ds", "css", "tokens.css"))
		writeTokens(t, filepath.Join(root, "frontend", "node_modules", "pkg", "vendor", "ds", "css", "tokens.css"))
		writeTokens(t, filepath.Join(root, "frontend", "javascript", ".github", "vendor", "ds", "css", "tokens.css"))
		vue := writeTokens(t, filepath.Join(root, "frontend", "javascript", "frontend-javascript-vue", "vendor", "ds", "css", "tokens.css"))
		require.Equal(t, vue, tests.ResolveFromAppRoot(root))
	})
}

func TestResolveFromAppRootFallsBackToVendoredApp(t *testing.T) {
	wrapTokens(t, "resolveFromAppRoot falls back to vendor/frontend-javascript-app when vendor/ds is missing", func(a *allure.Context) {
		root := t.TempDir()
		baked := writeTokens(t, filepath.Join(root, "frontend", "javascript", "frontend-javascript-vue", "vendor", "frontend-javascript-app", "css", "tokens.css"))
		require.Equal(t, baked, tests.ResolveFromAppRoot(root))
	})
}

func TestResolveFromAppRootFallsBackToHubPathWhenFrontendTreeIsMissing(t *testing.T) {
	wrapTokens(t, "resolveFromAppRoot falls back to hub path when frontend tree is missing", func(a *allure.Context) {
		root := t.TempDir()
		hub := filepath.Join(root, "frontend", "_shared", "frontend-javascript-app", "css", "tokens.css")
		abs, err := filepath.Abs(hub)
		require.NoError(t, err)
		require.Equal(t, abs, tests.ResolveFromAppRoot(root))
	})
}

func TestParseRootTokensRejectsCSSWithoutRootBlock(t *testing.T) {
	wrapTokens(t, "parseRootTokens rejects css without :root block", func(a *allure.Context) {
		css := filepath.Join(t.TempDir(), "tokens-invalid.css")
		require.NoError(t, os.WriteFile(css, []byte("body { color: red; }"), 0o644))
		_, err := tests.ParseRootTokens(css)
		require.Error(t, err)
		require.Contains(t, err.Error(), ":root block not found")
	})
}
