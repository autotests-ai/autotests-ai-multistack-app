package load

import io.gatling.core.Predef._
import io.gatling.http.Predef._

import scala.concurrent.duration._

/**
 * Contract chain against teaching `/api`: health → login → me → items → logout.
 * Default injection is 1 VU (CI / local smoke). `-Dgatling.profile=load`
 * holds N concurrent users (closed model, like JMeter loops=-1).
 */
class AuthApiSimulation extends Simulation {

  private val baseUrl = LoadConfig.apiBaseUrl

  private val httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")
    .userAgentHeader("tests-scala-gatling")

  private val authApi = scenario("auth-api")
    .exec(
      http("health")
        .get("/api/health")
        .check(status.is(200))
        .check(jsonPath("$.status").is("ok"))
    )
    .exec(
      http("login")
        .post("/api/auth/login")
        .body(StringBody(LoadConfig.loginJson))
        .check(status.is(200))
        .check(jsonPath("$.username").is(LoadConfig.username))
        .check(jsonPath("$.token").saveAs("token"))
    )
    .exec(
      http("me")
        .get("/api/auth/me")
        .header("Authorization", "Bearer #{token}")
        .check(status.is(200))
        .check(jsonPath("$.username").is(LoadConfig.username))
    )
    .exec(
      http("items")
        .get("/api/items")
        .check(status.is(200))
        .check(jsonPath("$.items[0].id").exists)
    )
    .exec(
      http("logout")
        .post("/api/auth/logout")
        .check(status.is(204))
    )

  LoadConfig.refuseSharedProd(baseUrl)

  private val population =
    if (LoadConfig.profile == "load") {
      authApi.inject(
        rampConcurrentUsers(0).to(LoadConfig.users).during(10.seconds),
        constantConcurrentUsers(LoadConfig.users).during(LoadConfig.duringSeconds.seconds)
      )
    } else {
      authApi.inject(atOnceUsers(1))
    }

  setUp(population)
    .protocols(httpProtocol)
    .assertions(
      global.successfulRequests.percent.gte(99.0),
      global.responseTime.percentile(95).lt(LoadConfig.p95Ms)
    )
}
