package load;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

import io.gatling.javaapi.core.ScenarioBuilder;
import io.gatling.javaapi.core.Simulation;
import io.gatling.javaapi.http.HttpProtocolBuilder;
import java.time.Duration;

/**
 * Contract chain against teaching {@code /api}: health → login → me → items → logout.
 * Default injection is 1 VU (CI / local smoke). {@code -Dgatling.profile=load} ramps N users.
 */
public class AuthApiSimulation extends Simulation {

    private final String baseUrl = LoadConfig.apiBaseUrl();

    HttpProtocolBuilder httpProtocol = http.baseUrl(baseUrl)
            .acceptHeader("application/json")
            .contentTypeHeader("application/json")
            .userAgentHeader("tests-java-gatling");

    ScenarioBuilder authApi = scenario("auth-api")
            .exec(http("health")
                    .get("/api/health")
                    .check(status().is(200))
                    .check(jsonPath("$.status").is("ok")))
            .exec(http("login")
                    .post("/api/auth/login")
                    .body(StringBody(LoadConfig.loginJson()))
                    .check(status().is(200))
                    .check(jsonPath("$.username").is(LoadConfig.username()))
                    .check(jsonPath("$.token").saveAs("token")))
            .exec(http("me")
                    .get("/api/auth/me")
                    .header("Authorization", "Bearer #{token}")
                    .check(status().is(200))
                    .check(jsonPath("$.username").is(LoadConfig.username())))
            .exec(http("items")
                    .get("/api/items")
                    .check(status().is(200))
                    .check(jsonPath("$.items[0].id").exists()))
            .exec(http("logout")
                    .post("/api/auth/logout")
                    .check(status().is(204)));

    {
        LoadConfig.refuseSharedProd(baseUrl);

        var population = "load".equals(LoadConfig.profile())
                ? authApi.injectOpen(rampUsers(LoadConfig.users()).during(Duration.ofSeconds(LoadConfig.duringSeconds())))
                : authApi.injectOpen(atOnceUsers(1));

        setUp(population)
                .protocols(httpProtocol)
                .assertions(
                        global().successfulRequests().percent().gte(99.0),
                        global().responseTime().percentile(95).lt(LoadConfig.p95Ms()));
    }
}
