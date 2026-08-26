package mill

import (
	"bytes"
	"context"
	"encoding/json"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"testing"
	"time"
)

const defaultBase = "https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/"

func TestRunLiveCrystals(t *testing.T) {
	if testing.Short() {
		t.Skip("live Chrome")
	}
	bin := greedyBin(t)
	sharedCDP := os.Getenv("GREEDY_CDP")
	base := defaultBase
	if u := os.Getenv("GREEDY_BASE_URL"); u != "" {
		base = u
	}
	matches, err := filepath.Glob(filepath.Join(moduleDir(t), "crystals", "*.json"))
	if err != nil {
		t.Fatal(err)
	}
	n := 0
	for _, path := range matches {
		name := filepath.Base(path)
		if strings.Contains(name, "example") {
			continue
		}
		n++
		t.Run(name, func(t *testing.T) {
			cdpURL := sharedCDP
			if cdpURL == "" {
				cdpURL = startChrome(t)
			}
			ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
			defer cancel()
			cmd := exec.CommandContext(ctx, bin, "run", "--cdp", cdpURL, "--base-url", base, "--mode", "none", path)
			var stdout, stderr bytes.Buffer
			cmd.Stdout = &stdout
			cmd.Stderr = &stderr
			if err := cmd.Run(); err != nil {
				t.Fatalf("%v\nstdout=%s\nstderr=%s", err, stdout.String(), stderr.String())
			}
			var res struct {
				OK    bool   `json:"ok"`
				ID    string `json:"id"`
				Error string `json:"error"`
			}
			if err := json.Unmarshal(stdout.Bytes(), &res); err != nil {
				t.Fatalf("json: %v %s", err, stdout.String())
			}
			if !res.OK {
				t.Fatalf("greedy run %s: %s", res.ID, res.Error)
			}
		})
	}
	if n == 0 {
		t.Fatal("no live crystals/*.json")
	}
}

func moduleDir(t *testing.T) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("caller")
	}
	return filepath.Dir(file)
}

func guruDir(t *testing.T) string {
	t.Helper()
	if d := os.Getenv("GREEDY_GURU"); d != "" {
		return d
	}
	dir := filepath.Clean(filepath.Join(moduleDir(t), "..", "..", "..", "..", "..", "greedy-token-home", "greedy-guru"))
	if _, err := os.Stat(filepath.Join(dir, "go.mod")); err != nil {
		t.Fatalf("greedy-guru not at %s: %v", dir, err)
	}
	return dir
}

func greedyBin(t *testing.T) string {
	t.Helper()
	if b := os.Getenv("GREEDY_BIN"); b != "" {
		return b
	}
	bin := filepath.Join(t.TempDir(), "greedy")
	cmd := exec.Command("go", "build", "-o", bin, "./cmd/greedy")
	cmd.Dir = guruDir(t)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("go build greedy: %v\n%s", err, out)
	}
	return bin
}

func chromeBin(t *testing.T) string {
	t.Helper()
	if b := os.Getenv("CHROME_BIN"); b != "" {
		return b
	}
	for _, c := range []string{
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		"google-chrome",
		"chromium",
		"chromium-browser",
	} {
		if strings.Contains(c, "/") {
			if _, err := os.Stat(c); err == nil {
				return c
			}
			continue
		}
		if p, err := exec.LookPath(c); err == nil {
			return p
		}
	}
	t.Fatal("Chrome not found; set CHROME_BIN or GREEDY_CDP")
	return ""
}

func startChrome(t *testing.T) string {
	t.Helper()
	if u := os.Getenv("GREEDY_CDP"); u != "" {
		return u
	}
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	port := ln.Addr().(*net.TCPAddr).Port
	_ = ln.Close()
	dir := t.TempDir()
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	cmd := exec.CommandContext(ctx, chromeBin(t),
		"--headless=new",
		"--disable-gpu",
		"--no-sandbox",
		"--no-first-run",
		"--no-default-browser-check",
		"--disable-extensions",
		"--remote-allow-origins=*",
		"--user-data-dir="+dir,
		"--remote-debugging-port="+strconv.Itoa(port),
		"--remote-debugging-address=127.0.0.1",
		"about:blank",
	)
	cmd.Env = append(os.Environ(), "HOME="+dir)
	if err := cmd.Start(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_ = cmd.Process.Kill()
		_, _ = cmd.Process.Wait()
	})
	url := "http://127.0.0.1:" + strconv.Itoa(port)
	deadline := time.Now().Add(8 * time.Second)
	for time.Now().Before(deadline) {
		resp, err := http.Get(url + "/json/version")
		if err == nil {
			_ = resp.Body.Close()
			if resp.StatusCode < 400 {
				return url
			}
		}
		time.Sleep(80 * time.Millisecond)
	}
	t.Fatalf("chrome debug port not ready on %s", url)
	return ""
}
