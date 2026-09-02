package tests

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

var (
	rootBlock = regexp.MustCompile(`(?s):root\s*\{([^}]+)\}`)
	tokenRe   = regexp.MustCompile(`(--[\w-]+)\s*:\s*([^;]+);`)
)

func AppRoot() string {
	return filepath.Clean(filepath.Join(moduleRoot(), "..", "..", ".."))
}

func DefaultTokensPath() string {
	return ResolveFromAppRoot(AppRoot())
}

func HubTokens(appRoot string) string {
	return filepath.Join(appRoot, "frontend", "_shared", "frontend-javascript-app", "css", "tokens.css")
}

func TokensCSSCandidates(appRoot string) []string {
	out := []string{HubTokens(appRoot)}
	return appendVendorTokens(filepath.Join(appRoot, "frontend"), out)
}

func FirstExisting(candidates ...string) string {
	fallback := ""
	for _, candidate := range candidates {
		abs, err := filepath.Abs(candidate)
		if err != nil {
			abs = candidate
		}
		fallback = abs
		if st, err := os.Stat(abs); err == nil && !st.IsDir() {
			return abs
		}
	}
	return fallback
}

func ResolveFromAppRoot(appRoot string) string {
	return FirstExisting(TokensCSSCandidates(appRoot)...)
}

func ParseRootTokens(cssFile string) (map[string]string, error) {
	raw, err := os.ReadFile(cssFile)
	if err != nil {
		return nil, err
	}
	match := rootBlock.FindSubmatch(raw)
	if match == nil {
		return nil, fmt.Errorf(":root block not found in %s", cssFile)
	}
	tokens := map[string]string{}
	for _, pair := range tokenRe.FindAllSubmatch(match[1], -1) {
		tokens[string(pair[1])] = strings.TrimSpace(string(pair[2]))
	}
	return tokens, nil
}

func appendVendorTokens(frontendRoot string, out []string) []string {
	entries, err := os.ReadDir(frontendRoot)
	if err != nil {
		return out
	}
	langs := make([]string, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() {
			langs = append(langs, entry.Name())
		}
	}
	sort.Strings(langs)
	for _, lang := range langs {
		langPath := filepath.Join(frontendRoot, lang)
		if !isProductLanguageDir(lang) {
			continue
		}
		cells, err := os.ReadDir(langPath)
		if err != nil {
			continue
		}
		names := make([]string, 0, len(cells))
		for _, cell := range cells {
			if cell.IsDir() && !strings.HasPrefix(cell.Name(), ".") {
				names = append(names, cell.Name())
			}
		}
		sort.Strings(names)
		for _, name := range names {
			cell := filepath.Join(langPath, name)
			out = append(out,
				filepath.Join(cell, "vendor", "ds", "css", "tokens.css"),
				filepath.Join(cell, "vendor", "frontend-javascript-app", "css", "tokens.css"),
			)
		}
	}
	return out
}

func isProductLanguageDir(name string) bool {
	if strings.HasPrefix(name, ".") || strings.HasPrefix(name, "_") {
		return false
	}
	switch name {
	case "scripts", "node_modules":
		return false
	default:
		return true
	}
}
