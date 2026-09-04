package tests

import (
	"encoding/json"
	"net/http"
	"testing"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func MockAvailable() bool {
	res, err := doRequest(http.MethodGet, "/__admin/scenarios", RequestOpt{})
	if err != nil || res.Status != http.StatusOK {
		return false
	}
	var payload map[string]any
	if json.Unmarshal(res.Raw, &payload) != nil {
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
