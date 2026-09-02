package api

import io.ktor.http.HttpMethod
import io.qameta.allure.Step

/**
 * WireMock scenario switch for the mock stand (compose profile `mock`; the gateway
 * proxies `/__admin/` to WireMock). Lets UI tests inject API failures that a healthy
 * live backend can never produce.
 *
 * In-cell HTTP is Ktor (same client as the api layer) — not a second folder.
 */
object MockScenarios {

    /** True when the stand under test exposes the WireMock admin API (mock stand only). */
    @JvmStatic
    fun available(): Boolean {
        return try {
            KtorHttp.request(HttpMethod.Get, "/__admin/scenarios").status == 200
        } catch (_: RuntimeException) {
            false
        }
    }

    @JvmStatic
    @Step("Mock: switch scenario {scenario} to state {state}")
    fun setState(scenario: String, state: String) {
        val response = KtorHttp.request(
            HttpMethod.Put,
            "/__admin/scenarios/$scenario/state",
            json = mapOf("state" to state),
        )
        check(response.status == 200) { response.body }
    }

    @JvmStatic
    @Step("Mock: reset all scenarios")
    fun resetAll() {
        val response = KtorHttp.request(HttpMethod.Post, "/__admin/scenarios/reset")
        check(response.status == 200) { response.body }
    }
}
