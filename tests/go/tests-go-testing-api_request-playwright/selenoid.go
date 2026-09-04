package tests

import (
	"net/url"
	"os"
	"strings"
)

const selenoidSessionName = "autotests-ai-multistack-go-pw"

func PreferWebSocket(envURL, configURL string) string {
	env := strings.TrimSpace(envURL)
	if IsWebSocket(env) {
		return env
	}
	return strings.TrimSpace(configURL)
}

func ResolveSelenoidURL(configRemoteURL string) string {
	return PreferWebSocket(os.Getenv("SELENOID_PLAYWRIGHT_URL"), configRemoteURL)
}

func IsWebSocket(raw string) bool {
	u := strings.ToLower(strings.TrimSpace(raw))
	return strings.HasPrefix(u, "ws://") || strings.HasPrefix(u, "wss://")
}

func IsHTTPURL(raw string) bool {
	u := strings.ToLower(strings.TrimSpace(raw))
	return strings.HasPrefix(u, "http://") || strings.HasPrefix(u, "https://")
}

func DescribeRemote(raw string) string {
	if strings.TrimSpace(raw) == "" {
		return ""
	}
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil {
		return "(unparseable remoteUrl)"
	}
	return parsed.Scheme + "://" + parsed.Hostname() + parsed.Path
}

func WithSessionQuery(ws string, enableVNC, enableVideo bool, videoName, screenResolution string) string {
	values := url.Values{}
	values.Set("name", selenoidSessionName)
	values.Set("sessionTimeout", "5m")
	values.Set("enableVNC", boolString(enableVNC))
	values.Set("enableVideo", boolString(enableVideo))
	if enableVideo {
		if strings.TrimSpace(videoName) != "" {
			values.Set("videoName", strings.TrimSpace(videoName))
		}
		if strings.TrimSpace(screenResolution) != "" {
			values.Set("screenResolution", strings.TrimSpace(screenResolution))
		}
	}
	encoded := values.Encode()
	base := strings.TrimSpace(ws)
	if strings.Contains(base, "?") {
		return base + "&" + encoded
	}
	return base + "?" + encoded
}

func VideoURL(folder, fileName string) string {
	if strings.TrimSpace(folder) == "" || strings.TrimSpace(fileName) == "" {
		return ""
	}
	base := strings.TrimSpace(folder)
	if !strings.HasSuffix(base, "/") {
		base += "/"
	}
	return base + strings.TrimSpace(fileName)
}

func boolString(v bool) string {
	if v {
		return "true"
	}
	return "false"
}
