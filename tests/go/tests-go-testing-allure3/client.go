package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/allure-framework/allure-go/commons/httpexchange"
)

const wrongCredentialsMessage = "Wrong login or password"

func newAPIClient(t *testing.T, a *allure.Context) *http.Client {
	t.Helper()
	transport := httpexchange.NewTransport(a.Context(), http.DefaultTransport)
	return &http.Client{Timeout: 15 * time.Second, Transport: transport}
}

func doJSON(t *testing.T, a *allure.Context, method, path string, body any) (int, []byte) {
	t.Helper()
	var rdr io.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
		rdr = bytes.NewReader(raw)
	}
	req, err := http.NewRequestWithContext(context.Background(), method, strings.TrimRight(apiBaseURL(), "/")+path, rdr)
	if err != nil {
		t.Fatal(err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	res, err := newAPIClient(t, a).Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	raw, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	return res.StatusCode, raw
}
