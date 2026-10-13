package dev.multistack.app.routes

import dev.multistack.app.service.AuthRequestValidator
import dev.multistack.app.service.AuthService
import dev.multistack.app.service.ItemService
import dev.multistack.app.dto.LoginRequest
import dev.multistack.app.dto.RegisterRequest
import dev.multistack.app.exception.AuthException
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import io.micrometer.prometheusmetrics.PrometheusMeterRegistry

/**
 * Public contract endpoints — `ApiController` + `OpenApiController` analogue.
 * `/api/openapi.yaml` and `/api/docs` serve the shared contract copy from the classpath.
 */
fun Route.apiRoutes(itemService: ItemService) {
    route("/api") {
        get("/health") {
            call.respond(itemService.health())
        }
        get("/items") {
            call.respond(itemService.listItems())
        }
        get("/openapi.yaml") {
            call.respondText(classpath("openapi.yaml"), YAML)
        }
        get("/docs") {
            call.respondText(classpath("openapi-docs.html"), ContentType.Text.Html)
        }
    }
}

/**
 * Auth endpoints — `AuthController` analogue. Only `/me` is behind the JWT provider:
 * Spring's `anyRequest().denyAll()` for everything else maps to "no route" in Ktor (404).
 */
fun Route.authRoutes(authService: AuthService) {
    route("/api/auth") {
        post("/register") {
            val request = call.receive<RegisterRequest>()
            AuthRequestValidator.assertValid(request.username, request.password)
            call.respond(HttpStatusCode.Created, authService.register(request))
        }
        post("/login") {
            val request = call.receive<LoginRequest>()
            AuthRequestValidator.assertValid(request.username, request.password)
            call.respond(authService.login(request))
        }
        post("/logout") {
            call.respond(HttpStatusCode.NoContent)
        }
        authenticate("auth-jwt") {
            get("/me") {
                call.respond(authService.profile(call.subject()))
            }
            delete("/me") {
                authService.deleteAccount(call.subject())
                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}

/** Management port surface — Spring Boot Actuator analogue (`health` + `prometheus` only). */
fun Route.managementRoutes(prometheusRegistry: PrometheusMeterRegistry) {
    route("/actuator") {
        get("/health") {
            call.respondText("""{"status":"UP"}""", ContentType.Application.Json)
        }
        get("/prometheus") {
            call.respondText(prometheusRegistry.scrape())
        }
    }
}

private fun ApplicationCall.subject(): String =
    principal<JWTPrincipal>()?.payload?.subject
        ?: throw AuthException(401, "Unauthorized")

private fun classpath(name: String): String =
    requireNotNull(object {}.javaClass.getResource("/$name")) { "$name not found on the classpath" }
        .readText()

private val YAML = ContentType.parse("application/yaml")
