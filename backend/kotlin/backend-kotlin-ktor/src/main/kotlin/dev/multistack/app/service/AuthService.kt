package dev.multistack.app.service

import dev.multistack.app.db.UserRepository
import dev.multistack.app.dto.AuthResponse
import dev.multistack.app.dto.LoginRequest
import dev.multistack.app.dto.RegisterRequest
import dev.multistack.app.dto.UserProfileResponse
import dev.multistack.app.exception.AuthException

class AuthService(
    private val userRepository: UserRepository,
    private val passwordHasher: PasswordHasher,
    private val jwtService: JwtService,
) {
    fun register(request: RegisterRequest): AuthResponse {
        if (userRepository.existsByUsername(request.username)) {
            throw AuthException(409, "Username already taken")
        }
        if (!userRepository.insert(request.username, passwordHasher.hash(request.password))) {
            throw AuthException(409, "Username already taken")
        }
        return buildAuthResponse(request.username)
    }

    fun login(request: LoginRequest): AuthResponse {
        val user = userRepository.findByUsername(request.username)
            ?: throw AuthException(401, "Wrong login or password")

        if (!passwordHasher.matches(request.password, user.passwordHash)) {
            throw AuthException(401, "Wrong login or password")
        }

        return buildAuthResponse(user.username)
    }

    fun profile(username: String): UserProfileResponse {
        userRepository.findByUsername(username)
            ?: throw AuthException(401, "Unauthorized")
        return UserProfileResponse(username)
    }

    /**
     * Authenticated self-delete. Tokens are stateless, so a JWT issued earlier keeps verifying
     * after deletion — but every endpoint that resolves the user ([profile], this one) answers
     * 401 once the row is gone. Also lets test suites clean up the users they register.
     */
    fun deleteAccount(username: String) {
        val user = userRepository.findByUsername(username)
            ?: throw AuthException(401, "Unauthorized")
        userRepository.deleteById(user.id)
    }

    private fun buildAuthResponse(username: String): AuthResponse =
        AuthResponse(
            jwtService.createToken(username),
            username,
            POST_AUTH_REDIRECT,
        )

    companion object {
        private const val POST_AUTH_REDIRECT = "/"
    }
}
