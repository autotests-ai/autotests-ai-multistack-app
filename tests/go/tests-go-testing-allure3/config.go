package tests

import (
	"os"
	"strings"
)

type standCfg struct {
	APIBaseURL string
}

var stands = map[string]standCfg{
	"prod":  {APIBaseURL: "https://autotests.ai/stack/backend-java-spring/"},
	"stage": {APIBaseURL: "https://stage.autotests.ai/stack/backend-java-spring/"},
	"mock":  {APIBaseURL: "http://127.0.0.1:9911/"},
	"ci":    {APIBaseURL: "http://127.0.0.1:8800/"},
}

func resolveStand() string {
	raw := strings.ToLower(strings.TrimSpace(firstNonEmpty(os.Getenv("STAND"), os.Getenv("ENV"), "prod")))
	if _, ok := stands[raw]; ok {
		return raw
	}
	return "prod"
}

func apiBaseURL() string {
	if v := strings.TrimSpace(os.Getenv("API_BASE_URL")); v != "" {
		return strings.TrimRight(v, "/") + "/"
	}
	return stands[resolveStand()].APIBaseURL
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}
