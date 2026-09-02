package tests

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"
	"time"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

const mockAdminTimeout = 5 * time.Second

func MockAvailable() bool {
	client := &http.Client{Timeout: mockAdminTimeout}
	req, err := http.NewRequest(http.MethodGet, strings.TrimRight(mustAPIBaseURL(), "/")+"/__admin/scenarios", nil)
	if err != nil {
		return false
	}
	res, err := client.Do(req)
	if err != nil {
		return false
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return false
	}
	var payload map[string]any
	if json.NewDecoder(res.Body).Decode(&payload) != nil {
		return false
	}
	_, ok := payload["scenarios"]
	return ok
}

func SetMockState(t *testing.T, a *allure.Context, scenario, state string) {
	t.Helper()
	body, err := json.Marshal(map[string]string{"state": state})
	if err != nil {
		t.Fatal(err)
	}
	res := Request(t, a, http.MethodPut, "/__admin/scenarios/"+scenario+"/state", RequestOpt{Raw: string(body)})
	if res.Status != http.StatusOK {
		t.Fatalf("WireMock set state %s=%s: HTTP %d %s", scenario, state, res.Status, string(res.Raw))
	}
}

func ResetMockScenarios(t *testing.T, a *allure.Context) {
	t.Helper()
	res := Request(t, a, http.MethodPost, "/__admin/scenarios/reset", RequestOpt{Raw: "{}"})
	if res.Status != http.StatusOK {
		t.Fatalf("WireMock reset: HTTP %d %s", res.Status, string(res.Raw))
	}
}
