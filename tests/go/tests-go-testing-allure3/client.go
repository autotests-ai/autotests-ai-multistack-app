package tests

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/allure-framework/allure-go/commons/httpexchange"
	"github.com/stretchr/testify/require"
)

const WrongCredentialsMessage = "Wrong login or password"

const httpTimeout = 10 * time.Second

// RequestOpt is a single HTTP call (JSON body, raw body, or bearer token).
type RequestOpt struct {
	JSON  any
	Raw   string
	Token string
}

// Result is status + raw bytes from net/http.
type Result struct {
	Status int
	Raw    []byte
}

func newAPIClient(t *testing.T, a *allure.Context) *http.Client {
	t.Helper()
	transport := httpexchange.NewTransport(a.Context(), http.DefaultTransport)
	return &http.Client{Timeout: httpTimeout, Transport: transport}
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

// Request performs method+path against the configured API origin.
func Request(t *testing.T, a *allure.Context, method, path string, opt RequestOpt) Result {
	t.Helper()
	var rdr io.Reader
	switch {
	case opt.Raw != "":
		rdr = strings.NewReader(opt.Raw)
	case opt.JSON != nil:
		raw, err := json.Marshal(opt.JSON)
		require.NoError(t, err)
		rdr = bytes.NewReader(raw)
	}
	req, err := http.NewRequestWithContext(
		context.Background(),
		method,
		strings.TrimRight(mustAPIBaseURL(), "/")+pathOf(path),
		rdr,
	)
	require.NoError(t, err)
	if opt.JSON != nil || opt.Raw != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	if opt.Token != "" {
		req.Header.Set("Authorization", "Bearer "+opt.Token)
	}
	res, err := newAPIClient(t, a).Do(req)
	require.NoError(t, err)
	defer res.Body.Close()
	raw, err := io.ReadAll(res.Body)
	require.NoError(t, err)
	return Result{Status: res.StatusCode, Raw: raw}
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
