package api;

import io.qameta.allure.Step;

import java.util.Map;

/**
 * WireMock scenario switch for the mock stand (compose profile {@code mock}; the gateway
 * proxies {@code /__admin/} to WireMock). Lets UI tests inject API failures that a healthy
 * live backend can never produce.
 */
public final class MockScenarios {

    private MockScenarios() {
    }

    /** True when the stand under test exposes the WireMock admin API (mock stand only). */
    public static boolean available() {
        try {
            return PlaywrightHttp.request("GET", "/__admin/scenarios").status() == 200;
        } catch (RuntimeException gatewayUnreachable) {
            return false;
        }
    }

    @Step("Mock: switch scenario {scenario} to state {state}")
    public static void setState(String scenario, String state) {
        HttpResult response = PlaywrightHttp.request(
                "PUT",
                "/__admin/scenarios/" + scenario + "/state",
                Map.of("state", state),
                null,
                null);
        if (response.status() != 200) {
            throw new IllegalStateException(response.body());
        }
    }

    @Step("Mock: reset all scenarios")
    public static void resetAll() {
        HttpResult response = PlaywrightHttp.request("POST", "/__admin/scenarios/reset");
        if (response.status() != 200) {
            throw new IllegalStateException(response.body());
        }
    }
}
