package load

import io.gatling.javaapi.core.CoreDsl.StringBody
import io.gatling.javaapi.core.CoreDsl.atOnceUsers
import io.gatling.javaapi.core.CoreDsl.global
import io.gatling.javaapi.core.CoreDsl.jsonPath
import io.gatling.javaapi.core.CoreDsl.rampUsers
import io.gatling.javaapi.core.CoreDsl.scenario
import io.gatling.javaapi.core.Simulation
import io.gatling.javaapi.http.HttpDsl.http
import io.gatling.javaapi.http.HttpDsl.status
import java.time.Duration

/**
 * Contract chain against teaching `/api`: health → login → me → items → logout.
 * Default injection is 1 VU (local smoke). `-Dgatling.profile=load` ramps N users.
 */
class AuthApiSimulation : Simulation() {

    private val baseUrl = LoadConfig.apiBaseUrl()

    private val httpProtocol = http.baseUrl(baseUrl)
        .acceptHeader("application/json")
        .contentTypeHeader("application/json")
        .userAgentHeader("tests-kotlin-gatling")

    private val authApi = scenario("auth-api")
        .exec(
            http("health")
                .get("/api/health")
                .check(status().`is`(200))
                .check(jsonPath("$.status").`is`("ok"))
        )
        .exec(
            http("login")
                .post("/api/auth/login")
                .body(StringBody(LoadConfig.loginJson()))
                .check(status().`is`(200))
                .check(jsonPath("$.username").`is`(LoadConfig.username()))
                .check(jsonPath("$.token").saveAs("token"))
        )
        .exec(
            http("me")
                .get("/api/auth/me")
                .header("Authorization", "Bearer #{token}")
                .check(status().`is`(200))
                .check(jsonPath("$.username").`is`(LoadConfig.username()))
        )
        .exec(
            http("items")
                .get("/api/items")
                .check(status().`is`(200))
                .check(jsonPath("$.items[0].id").exists())
        )
        .exec(
            http("logout")
                .post("/api/auth/logout")
                .check(status().`is`(204))
        )

    init {
        LoadConfig.refuseSharedProd(baseUrl)

        val population = if (LoadConfig.profile() == "load") {
            authApi.injectOpen(
                rampUsers(LoadConfig.users()).during(Duration.ofSeconds(LoadConfig.duringSeconds().toLong()))
            )
        } else {
            authApi.injectOpen(atOnceUsers(1))
        }

        setUp(population)
            .protocols(httpProtocol)
            .assertions(
                global().successfulRequests().percent().gte(99.0),
                global().responseTime().percentile(95.0).lt(LoadConfig.p95Ms())
            )
    }
}
