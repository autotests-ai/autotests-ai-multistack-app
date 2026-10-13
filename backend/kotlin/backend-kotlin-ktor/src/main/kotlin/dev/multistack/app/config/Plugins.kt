package dev.multistack.app.config

import dev.multistack.app.dto.ErrorResponse
import dev.multistack.app.exception.AuthException
import dev.multistack.app.exception.ValidationException
import dev.multistack.app.service.JwtService
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.auth.Authentication
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.jwt.jwt
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respond

/**
 * CORS for browser frontends calling the JSON API on another origin.
 * Same policy as `CorsConfig` in the Spring modules: any origin, no credentials,
 * `Authorization` exposed to the client.
 */
fun Application.installCors() {
    install(CORS) {
        anyHost()
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Patch)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Options)
        allowHeaders { true }
        exposeHeader(HttpHeaders.Authorization)
        allowCredentials = false
    }
}

/**
 * Bearer JWT — Ktor's Authentication plugin replaces `JwtAuthFilter` + `SecurityConfig`.
 * An invalid or missing token on a protected route is answered by the JWT challenge with
 * a bare 401, mirroring the Spring entry point's `sendError(401)` (no body).
 */
fun Application.installJwtAuth(jwtService: JwtService) {
    install(Authentication) {
        jwt("auth-jwt") {
            verifier(jwtService.verifier)
            validate { credential ->
                credential.payload.subject?.let { JWTPrincipal(credential.payload) }
            }
        }
    }
}

/** Maps exceptions to the shared error envelope `{"message": ...}` — same contract as `AuthExceptionHandler`. */
fun Application.installStatusPages() {
    install(StatusPages) {
        exception<ValidationException> { call, ex ->
            call.respond(HttpStatusCode.BadRequest, ErrorResponse(requireNotNull(ex.message)))
        }
        exception<AuthException> { call, ex ->
            call.respond(HttpStatusCode.fromValue(ex.status), ErrorResponse(requireNotNull(ex.message)))
        }
        // A malformed or missing body fails inside call.receive — same answer Spring gives via
        // HttpMessageNotReadableException before validation ever runs.
        exception<BadRequestException> { call, _ ->
            call.respond(HttpStatusCode.BadRequest, ErrorResponse("Request body is not valid JSON"))
        }
        exception<Throwable> { call, _ ->
            call.respond(HttpStatusCode.InternalServerError, ErrorResponse("Internal server error"))
        }
    }
}
