package api

import com.microsoft.playwright.PlaywrightException
import io.qameta.allure.Step

/**
 * WireMock scenario switch for the mock stand (compose profile `mock`; the gateway
 * proxies `/__admin/` to WireMock). Lets UI tests inject API failures that a healthy
 * live backend can never produce.
 *
 * In-cell HTTP is Playwright APIRequest — not a second folder.
 */
object MockScenarios {

    /** True when the stand under test exposes the WireMock admin API (mock stand only). */
    @JvmStatic
    fun available(): Boolean {
        return try {
            PlaywrightHttp.request("GET", "/__admin/scenarios").status == 200
        } catch (_: PlaywrightException) {
            false
        } catch (_: RuntimeException) {
            false
        }
    }

    @JvmStatic
    @Step("Mock: switch scenario {scenario} to state {state}")
    fun setState(scenario: String, state: String) {
        val response = PlaywrightHttp.request(
            "PUT",
            "/__admin/scenarios/$scenario/state",
            json = mapOf("state" to state),
        )
        check(response.status == 200) { response.body }
    }

    @JvmStatic
    @Step("Mock: reset all scenarios")
    fun resetAll() {
        val response = PlaywrightHttp.request("POST", "/__admin/scenarios/reset")
        check(response.status == 200) { response.body }
    }
}
