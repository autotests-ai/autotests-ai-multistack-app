package tests

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"testing"
	"time"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/mxschmitt/playwright-go"
	"github.com/stretchr/testify/require"
)

const WrongCredentialsMessage = "Wrong login or password"

const httpTimeoutMs = 10_000.0

var (
	apiOnce sync.Once
	apiCtx  playwright.APIRequestContext
	apiErr  error
)

// RequestOpt is a single HTTP call (JSON body, raw body, or bearer token).
type RequestOpt struct {
	JSON  any
	Raw   string
	Token string
}

// Result is status + raw bytes from Playwright APIRequest.
type Result struct {
	Status int
	Raw    []byte
}

func pathOf(path string) string {
	if strings.HasPrefix(path, "/") {
		return path
	}
	return "/" + path
}

// Username is a throwaway identity; backend @Size(min=3, max=64).
func Username() string {
	var buf [5]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return fmt.Sprintf("user_%d", time.Now().UnixNano()%1_000_000)
	}
	return "user_" + hex.EncodeToString(buf[:])
}

// UsernameAtMinLength is exactly @Size(min=3) — unique hex slice.
func UsernameAtMinLength() string {
	var buf [2]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return fmt.Sprintf("%03d", time.Now().UnixNano()%1000)
	}
	return hex.EncodeToString(buf[:])[:3]
}

// PasswordAtMinLength is exactly @Size(min=6).
func PasswordAtMinLength() string {
	return "123456"
}

func ensureAPI() error {
	apiOnce.Do(func() {
		installOnce.Do(func() {
			_ = playwright.Install(&playwright.RunOptions{Browsers: []string{"chromium"}})
		})
		pw, err := playwright.Run()
		if err != nil {
			apiErr = err
			return
		}
		ctx, err := pw.Request.NewContext(playwright.APIRequestNewContextOptions{
			BaseURL:           playwright.String(strings.TrimRight(mustAPIBaseURL(), "/")),
			Timeout:           playwright.Float(httpTimeoutMs),
			IgnoreHttpsErrors: playwright.Bool(true),
		})
		if err != nil {
			apiErr = err
			return
		}
		apiCtx = ctx
	})
	return apiErr
}

func doRequest(method, path string, opt RequestOpt) (Result, error) {
	if err := ensureAPI(); err != nil {
		return Result{}, err
	}
	headers := map[string]string{}
	var data any
	switch {
	case opt.Raw != "":
		data = opt.Raw
		headers["Content-Type"] = "application/json"
	case opt.JSON != nil:
		data = opt.JSON
	}
	if opt.Token != "" {
		headers["Authorization"] = "Bearer " + opt.Token
	}
	urlPath := pathOf(path)
	timeout := playwright.Float(httpTimeoutMs)
	var (
		res playwright.APIResponse
		err error
	)
	switch method {
	case http.MethodGet:
		res, err = apiCtx.Get(urlPath, playwright.APIRequestContextGetOptions{
			Headers: headers,
			Timeout: timeout,
		})
	case http.MethodPost:
		res, err = apiCtx.Post(urlPath, playwright.APIRequestContextPostOptions{
			Data:    data,
			Headers: headers,
			Timeout: timeout,
		})
	case http.MethodPut:
		res, err = apiCtx.Put(urlPath, playwright.APIRequestContextPutOptions{
			Data:    data,
			Headers: headers,
			Timeout: timeout,
		})
	case http.MethodDelete:
		res, err = apiCtx.Delete(urlPath, playwright.APIRequestContextDeleteOptions{
			Headers: headers,
			Timeout: timeout,
		})
	default:
		return Result{}, fmt.Errorf("unsupported method %s", method)
	}
	if err != nil {
		return Result{}, err
	}
	defer res.Dispose()
	raw, err := res.Body()
	if err != nil {
		return Result{}, err
	}
	return Result{Status: res.Status(), Raw: raw}, nil
}

// Request performs method+path against the configured API origin via Playwright APIRequest.
func Request(t *testing.T, a *allure.Context, method, path string, opt RequestOpt) Result {
	t.Helper()
	_ = a
	res, err := doRequest(method, path, opt)
	require.NoError(t, err)
	return res
}

func (r Result) Map(t *testing.T) map[string]any {
	t.Helper()
	var body map[string]any
	require.NoError(t, json.Unmarshal(r.Raw, &body))
	return body
}

func Login(t *testing.T, a *allure.Context, username, password string) string {
	t.Helper()
	res := Request(t, a, http.MethodPost, "/api/auth/login", RequestOpt{
		JSON: map[string]string{"username": username, "password": password},
	})
	require.Equal(t, http.StatusOK, res.Status, string(res.Raw))
	token, _ := res.Map(t)["token"].(string)
	require.NotEmpty(t, token)
	return token
}

func Register(t *testing.T, a *allure.Context, username, password string) string {
	t.Helper()
	res := Request(t, a, http.MethodPost, "/api/auth/register", RequestOpt{
		JSON: map[string]string{"username": username, "password": password},
	})
	require.Equal(t, http.StatusCreated, res.Status, string(res.Raw))
	token, _ := res.Map(t)["token"].(string)
	require.NotEmpty(t, token)
	return token
}

func DeleteAccount(t *testing.T, a *allure.Context, token string) {
	t.Helper()
	res := Request(t, a, http.MethodDelete, "/api/auth/me", RequestOpt{Token: token})
	require.Equal(t, http.StatusNoContent, res.Status, string(res.Raw))
}

func ItemNames(t *testing.T, body map[string]any) []string {
	t.Helper()
	raw, ok := body["items"].([]any)
	require.True(t, ok, "items array")
	names := make([]string, 0, len(raw))
	for _, item := range raw {
		row, ok := item.(map[string]any)
		require.True(t, ok)
		name, _ := row["name"].(string)
		names = append(names, name)
	}
	return names
}
