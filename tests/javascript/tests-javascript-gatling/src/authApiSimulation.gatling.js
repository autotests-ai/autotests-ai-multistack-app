/**
 * Contract chain against teaching /api: health → login → me → items → logout.
 * Default injection is 1 VU (local smoke). profile=load holds N concurrent
 * users (closed model, like Java injectClosed / JMeter loops=-1).
 */
import {
  atOnceUsers,
  constantConcurrentUsers,
  global,
  jsonPath,
  rampConcurrentUsers,
  scenario,
  simulation,
  StringBody,
} from "@gatling.io/core";
import { http, status } from "@gatling.io/http";
import {
  apiBaseUrl,
  duringSeconds,
  loginJson,
  p95Ms,
  profile,
  refuseSharedProd,
  username,
  users,
} from "./loadConfig.js";

export default simulation((setUp) => {
  const baseUrl = apiBaseUrl();
  refuseSharedProd(baseUrl);

  const httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")
    .userAgentHeader("tests-javascript-gatling");

  const authApi = scenario("auth-api")
    .exec(
      http("health")
        .get("/api/health")
        .check(status().is(200))
        .check(jsonPath("$.status").is("ok")),
    )
    .exec(
      http("login")
        .post("/api/auth/login")
        .body(StringBody(loginJson()))
        .check(status().is(200))
        .check(jsonPath("$.username").is(username()))
        .check(jsonPath("$.token").saveAs("token")),
    )
    .exec(
      http("me")
        .get("/api/auth/me")
        .header("Authorization", "Bearer #{token}")
        .check(status().is(200))
        .check(jsonPath("$.username").is(username())),
    )
    .exec(
      http("items")
        .get("/api/items")
        .check(status().is(200))
        .check(jsonPath("$.items[0].id").exists()),
    )
    .exec(http("logout").post("/api/auth/logout").check(status().is(204)));

  const population =
    profile() === "load"
      ? authApi.injectClosed(
          rampConcurrentUsers(0).to(users()).during(10),
          constantConcurrentUsers(users()).during(duringSeconds()),
        )
      : authApi.injectOpen(atOnceUsers(1));

  setUp(population)
    .protocols(httpProtocol)
    .assertions(global().successfulRequests().percent().gte(99.0), global().responseTime().percentile(95).lt(p95Ms()));
});
