package dev.multistack.app.controller

import dev.multistack.app.dto.AuthResponse
import dev.multistack.app.dto.LoginRequest
import dev.multistack.app.dto.RegisterRequest
import dev.multistack.app.dto.UserProfileResponse
import dev.multistack.app.exception.AuthException
import dev.multistack.app.service.AuthService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
) {
    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): ResponseEntity<AuthResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request))

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): AuthResponse =
        authService.login(request)

    @PostMapping("/logout")
    fun logout(): ResponseEntity<Void> = ResponseEntity.noContent().build()

    @GetMapping("/me")
    fun me(@AuthenticationPrincipal username: String): UserProfileResponse =
        authService.profile(username)

    @DeleteMapping("/me")
    fun deleteAccount(@AuthenticationPrincipal username: String): ResponseEntity<Void> {
        authService.deleteAccount(username)
        return ResponseEntity.noContent().build()
    }
}

@RestControllerAdvice
class AuthExceptionHandler {
    @ExceptionHandler(AuthException::class)
    fun handleAuthException(ex: AuthException): ResponseEntity<Map<String, String>> =
        ResponseEntity.status(ex.status).body(mapOf("message" to requireNotNull(ex.message)))

    // Without a handler here the container forwards to /error, which the security chain answers
    // with 401 — a bean-validation failure would never reach the client as 400.
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(ex: MethodArgumentNotValidException): ResponseEntity<Map<String, String>> {
        val message = ex.bindingResult.fieldErrors
            .joinToString("; ") { "${it.field} ${it.defaultMessage}" }
        return ResponseEntity.badRequest().body(mapOf("message" to message))
    }

    // Same /error trap as above. Hit more often than in Java: the DTOs are non-null Kotlin types,
    // so a missing or null field fails in Jackson before bean validation ever runs.
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleUnreadableBody(): ResponseEntity<Map<String, String>> =
        ResponseEntity.badRequest().body(mapOf("message" to "Request body is not valid JSON"))
}
