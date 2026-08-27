package mill

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"
)

func millRoot(t *testing.T) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("caller")
	}
	return filepath.Dir(file)
}

func liveCrystals(t *testing.T) []string {
	t.Helper()
	matches, err := filepath.Glob(filepath.Join(millRoot(t), "crystals", "*.json"))
	if err != nil {
		t.Fatal(err)
	}
	var out []string
	for _, path := range matches {
		if strings.Contains(filepath.Base(path), "example") {
			continue
		}
		out = append(out, path)
	}
	if len(out) == 0 {
		t.Fatal("no live crystals/*.json")
	}
	return out
}

func uniqueRegisterUser() string {
	var b [5]byte
	if _, err := rand.Read(b[:]); err != nil {
		panic(err)
	}
	return "user_" + hex.EncodeToString(b[:])
}

// registerIRForRun copies register/delete crystals and fills a crypto/rand
// username (stdlib, not faker) so mill replay does not collide if the store is sticky.
func registerIRForRun(t *testing.T, path string) string {
	t.Helper()
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var doc map[string]any
	if err := json.Unmarshal(raw, &doc); err != nil {
		t.Fatal(err)
	}
	if doc["id"] != "register" && doc["id"] != "delete" {
		return path
	}
	name := uniqueRegisterUser()
	steps, _ := doc["steps"].([]any)
	for _, step := range steps {
		m, ok := step.(map[string]any)
		if !ok {
			continue
		}
		op, _ := m["op"].(string)
		sel, _ := m["selector"].(string)
		if op == "fill" && sel == "[data-testid=register-login-input]" {
			m["value"] = name
		}
		if op == "text" && sel == "[data-testid=welcome-message]" {
			m["value"] = "Welcome, " + name + "!"
		}
	}
	out := filepath.Join(t.TempDir(), filepath.Base(path))
	b, err := json.MarshalIndent(doc, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(out, append(b, '\n'), 0o644); err != nil {
		t.Fatal(err)
	}
	return out
}

func TestRegisterIRForRunPatchesUsername(t *testing.T) {
	src := filepath.Join(t.TempDir(), "in.json")
	if err := os.WriteFile(src, []byte(`{
  "id": "register",
  "steps": [
    {"op": "fill", "selector": "[data-testid=register-login-input]", "value": "reguser1"},
    {"op": "text", "selector": "[data-testid=welcome-message]", "value": "Welcome, reguser1!"}
  ]
}
`), 0o644); err != nil {
		t.Fatal(err)
	}
	out := registerIRForRun(t, src)
	raw, err := os.ReadFile(out)
	if err != nil {
		t.Fatal(err)
	}
	var doc map[string]any
	if err := json.Unmarshal(raw, &doc); err != nil {
		t.Fatal(err)
	}
	steps := doc["steps"].([]any)
	fill := steps[0].(map[string]any)["value"].(string)
	text := steps[1].(map[string]any)["value"].(string)
	if fill == "reguser1" || !strings.HasPrefix(fill, "user_") {
		t.Fatalf("want crypto/rand user, got %q", fill)
	}
	if text != "Welcome, "+fill+"!" {
		t.Fatalf("welcome %q", text)
	}
}

func TestRegisterIRForRunPatchesDelete(t *testing.T) {
	src := filepath.Join(t.TempDir(), "in.json")
	if err := os.WriteFile(src, []byte(`{
  "id": "delete",
  "steps": [
    {"op": "fill", "selector": "[data-testid=register-login-input]", "value": "deluser1"},
    {"op": "text", "selector": "[data-testid=welcome-message]", "value": "Welcome, deluser1!"}
  ]
}
`), 0o644); err != nil {
		t.Fatal(err)
	}
	out := registerIRForRun(t, src)
	raw, err := os.ReadFile(out)
	if err != nil {
		t.Fatal(err)
	}
	var doc map[string]any
	if err := json.Unmarshal(raw, &doc); err != nil {
		t.Fatal(err)
	}
	steps := doc["steps"].([]any)
	fill := steps[0].(map[string]any)["value"].(string)
	text := steps[1].(map[string]any)["value"].(string)
	if fill == "deluser1" || !strings.HasPrefix(fill, "user_") {
		t.Fatalf("want crypto/rand user, got %q", fill)
	}
	if text != "Welcome, "+fill+"!" {
		t.Fatalf("welcome %q", text)
	}
}

func TestRegisterIRForRunLeavesOtherCrystals(t *testing.T) {
	src := filepath.Join(t.TempDir(), "login.json")
	if err := os.WriteFile(src, []byte(`{"id":"login"}`), 0o644); err != nil {
		t.Fatal(err)
	}
	if registerIRForRun(t, src) != src {
		t.Fatal("login IR must not be copied")
	}
}

func TestValidateCrystals(t *testing.T) {
	bin := greedyBinary(t)
	for _, crystal := range liveCrystals(t) {
		t.Run(filepath.Base(crystal), func(t *testing.T) {
			cmd := exec.Command(bin, "validate", crystal)
			out, err := cmd.CombinedOutput()
			if err != nil {
				t.Fatalf("greedy validate: %v\n%s", err, out)
			}
			var m map[string]any
			if err := json.Unmarshal(out, &m); err != nil {
				t.Fatalf("json: %v\n%s", err, out)
			}
			if m["ok"] != true {
				t.Fatalf("%s", out)
			}
		})
	}
}

func TestRunCrystals(t *testing.T) {
	if testing.Short() {
		t.Skip("live Chrome")
	}
	bin := greedyBinary(t)
	ctx, cancel := context.WithTimeout(context.Background(), 180*time.Second)
	t.Cleanup(cancel)

	cdpURL := os.Getenv("GREEDY_CDP")
	if cdpURL == "" {
		cdpURL = startChrome(t, ctx)
	}
	baseURL := os.Getenv("GREEDY_BASE_URL")
	if baseURL == "" {
		srv := serveApp(t, filepath.Join(millRoot(t), "testdata", "app"))
		baseURL = appURL(srv)
	}

	for _, crystal := range liveCrystals(t) {
		t.Run(filepath.Base(crystal), func(t *testing.T) {
			runCtx, runCancel := context.WithTimeout(ctx, 60*time.Second)
			defer runCancel()
			ir := registerIRForRun(t, crystal)
			cmd := exec.CommandContext(runCtx, bin, "run",
				"--cdp", cdpURL,
				"--base-url", baseURL,
				"--mode", "none",
				ir,
			)
			var stdout, stderr bytes.Buffer
			cmd.Stdout = &stdout
			cmd.Stderr = &stderr
			if err := cmd.Run(); err != nil {
				t.Fatalf("greedy run: %v\nstdout=%s\nstderr=%s", err, stdout.String(), stderr.String())
			}
			var m map[string]any
			if err := json.Unmarshal(stdout.Bytes(), &m); err != nil {
				t.Fatalf("json: %v\n%s", err, stdout.String())
			}
			if m["ok"] != true {
				t.Fatalf("%s", stdout.String())
			}
			t.Logf("%s wall_ms=%v reset_ms=%v", m["id"], m["wall_ms"], m["reset_ms"])
		})
	}
}

var (
	greedyOnce sync.Once
	greedyPath string
	greedyErr  error
)

func greedyBinary(t *testing.T) string {
	t.Helper()
	greedyOnce.Do(func() {
		if v := os.Getenv("GREEDY_BIN"); v != "" {
			greedyPath = v
			return
		}
		if p, err := exec.LookPath("greedy"); err == nil {
			greedyPath = p
			return
		}
		root := findGreedyGuru(millRoot(t))
		if root == "" {
			greedyErr = fmt.Errorf("set GREEDY_BIN or run inside the monorepo (greedy-guru)")
			return
		}
		out := filepath.Join(os.TempDir(), fmt.Sprintf("greedy-mill-%d", os.Getpid()))
		cmd := exec.Command("go", "build", "-o", out, "./cmd/greedy")
		cmd.Dir = root
		if b, err := cmd.CombinedOutput(); err != nil {
			greedyErr = fmt.Errorf("go build greedy: %v\n%s", err, b)
			return
		}
		greedyPath = out
	})
	if greedyErr != nil {
		t.Fatal(greedyErr)
	}
	if greedyPath == "" {
		t.Fatal("greedy binary")
	}
	return greedyPath
}

func findGreedyGuru(start string) string {
	dir := start
	for i := 0; i < 12; i++ {
		for _, rel := range []string{
			filepath.Join("greedy-token-home", "greedy-guru", "go.mod"),
			filepath.Join("projects", "greedy-token-home", "greedy-guru", "go.mod"),
		} {
			cand := filepath.Join(dir, rel)
			if _, err := os.Stat(cand); err == nil {
				return filepath.Dir(cand)
			}
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return ""
}

func serveApp(t *testing.T, dir string) *httptest.Server {
	t.Helper()
	mux := http.NewServeMux()
	mux.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, filepath.Join(dir, "login.html"))
	})
	mux.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, filepath.Join(dir, "register.html"))
	})
	mux.HandleFunc("/home", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, filepath.Join(dir, "home.html"))
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(dir, "home.html"))
	})
	srv := httptest.NewUnstartedServer(mux)
	ln, err := net.Listen("tcp", "0.0.0.0:0")
	if err != nil {
		t.Fatal(err)
	}
	srv.Listener = ln
	srv.Start()
	t.Cleanup(srv.Close)
	return srv
}

func chromeFlags(userDataDir string, debugPort int, debugAddr string) []string {
	return []string{
		"--headless=new",
		"--disable-gpu",
		"--no-sandbox",
		"--disable-dev-shm-usage",
		"--no-first-run",
		"--no-default-browser-check",
		"--disable-extensions",
		"--disable-component-extensions-with-background-pages",
		"--disable-background-networking",
		"--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessChecksWebRTC,PrivateNetworkAccessPermissionPrompt,BlockInsecurePrivateNetworkRequests",
		"--remote-allow-origins=*",
		"--user-data-dir=" + userDataDir,
		"--remote-debugging-port=" + strconv.Itoa(debugPort),
		"--remote-debugging-address=" + debugAddr,
	}
}

var (
	appHostMu sync.Mutex
	appHost   = "127.0.0.1"
)

func setAppHost(h string) {
	appHostMu.Lock()
	appHost = h
	appHostMu.Unlock()
}

func currentAppHost() string {
	appHostMu.Lock()
	defer appHostMu.Unlock()
	return appHost
}

func appURL(srv *httptest.Server) string {
	u, err := url.Parse(srv.URL)
	if err != nil {
		return srv.URL
	}
	_, port, err := net.SplitHostPort(u.Host)
	if err != nil {
		return srv.URL
	}
	u.Host = net.JoinHostPort(currentAppHost(), port)
	return u.String()
}

func startChrome(t *testing.T, ctx context.Context) string {
	t.Helper()
	unlock := chromeLock()
	defer unlock()
	if os.Getenv("CHROME_BIN") != "" {
		setAppHost("127.0.0.1")
		return startHostChrome(t, ctx)
	}
	setAppHost("host.docker.internal")
	return startPwMin(t, ctx)
}

func chromeLock() func() {
	dir := filepath.Join(os.TempDir(), "tests-go-cdp-chrome.lock.d")
	deadline := time.Now().Add(30 * time.Second)
	for {
		if err := os.Mkdir(dir, 0o700); err == nil {
			return func() { _ = os.Remove(dir) }
		}
		if time.Now().After(deadline) {
			return func() {}
		}
		time.Sleep(40 * time.Millisecond)
	}
}

func startHostChrome(t *testing.T, ctx context.Context) string {
	t.Helper()
	bin := os.Getenv("CHROME_BIN")
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	port := ln.Addr().(*net.TCPAddr).Port
	_ = ln.Close()
	dir := t.TempDir()
	cmd := exec.CommandContext(ctx, bin, append(chromeFlags(dir, port, "127.0.0.1"), "about:blank")...)
	cmd.Env = append(os.Environ(), "HOME="+dir)
	if err := cmd.Start(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_ = cmd.Process.Kill()
		_, _ = cmd.Process.Wait()
	})
	url := "http://127.0.0.1:" + strconv.Itoa(port)
	waitDebug(t, ctx, url, 8*time.Second, "")
	return url
}

func startPwMin(t *testing.T, ctx context.Context) string {
	t.Helper()
	if _, err := exec.LookPath("docker"); err != nil {
		t.Skip("docker not on PATH; need playwright-chromium min")
	}
	image := os.Getenv("GREEDY_PW_MIN_IMAGE")
	if image == "" {
		image = "qaguru/playwright-chromium:1.61.1-min"
	}
	if err := exec.Command("docker", "image", "inspect", image).Run(); err != nil {
		t.Skipf("need %s (docker pull)", image)
	}
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	hostPort := ln.Addr().(*net.TCPAddr).Port
	_ = ln.Close()
	proxy := filepath.Join(millRoot(t), "cdpproxy.pl")
	name := fmt.Sprintf("tests-go-cdp-%d-%d", os.Getpid(), hostPort)
	chromeCmd := bashQuote(append(chromeFlags("/tmp/greedy-cdp", 9222, "127.0.0.1"), "about:blank"))
	script := `set -e
perl /tmp/cdpproxy.pl &
bin=""
for c in /ms-playwright/chromium-*/chrome-linux64/chrome /ms-playwright/chromium-*/chrome-linux/chrome; do
  if [ -x "$c" ]; then bin=$c; break; fi
done
if [ -z "$bin" ]; then echo "no playwright chromium in image" >&2; exit 1; fi
exec "$bin" ` + chromeCmd
	args := []string{
		"run", "-d", "--rm",
		"--name", name,
		"--init",
		"--shm-size", "256m",
		"--add-host", "host.docker.internal:host-gateway",
		"-p", fmt.Sprintf("127.0.0.1:%d:9223", hostPort),
		"-v", proxy + ":/tmp/cdpproxy.pl:ro",
		"--entrypoint", "/bin/bash",
		image,
		"-lc", script,
	}
	out, err := exec.CommandContext(ctx, "docker", args...).CombinedOutput()
	if err != nil {
		t.Fatalf("docker run pw-min: %v\n%s", err, out)
	}
	t.Cleanup(func() {
		_ = exec.Command("docker", "rm", "-f", name).Run()
	})
	url := "http://127.0.0.1:" + strconv.Itoa(hostPort)
	waitDebug(t, ctx, url, 20*time.Second, name)
	return url
}

func bashQuote(ss []string) string {
	var b strings.Builder
	for i, s := range ss {
		if i > 0 {
			b.WriteByte(' ')
		}
		b.WriteString(strconv.Quote(s))
	}
	return b.String()
}

func waitDebug(t *testing.T, ctx context.Context, debugURL string, d time.Duration, dumpName string) {
	t.Helper()
	deadline := time.Now().Add(d)
	for {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, debugURL+"/json/version", nil)
		if err == nil {
			resp, err := http.DefaultClient.Do(req)
			if err == nil {
				_ = resp.Body.Close()
				if resp.StatusCode < 400 {
					return
				}
			}
		}
		if time.Now().After(deadline) {
			extra := ""
			if dumpName != "" {
				b, _ := exec.Command("docker", "logs", "--tail", "40", dumpName).CombinedOutput()
				extra = "\n" + string(b)
			}
			t.Fatalf("chrome debug port not ready on %s%s", debugURL, extra)
		}
		select {
		case <-ctx.Done():
			t.Fatalf("chrome debug wait: %v", ctx.Err())
		case <-time.After(80 * time.Millisecond):
		}
	}
}
