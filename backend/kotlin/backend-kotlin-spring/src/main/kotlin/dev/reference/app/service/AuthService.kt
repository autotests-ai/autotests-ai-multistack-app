package dev.reference.app.service

import dev.reference.app.dto.AuthResponse
import dev.reference.app.dto.LoginRequest
import dev.reference.app.dto.RegisterRequest
import dev.reference.app.dto.UserProfileResponse
import dev.reference.app.entity.UserEntity
import dev.reference.app.exception.AuthException
import dev.reference.app.repository.UserRepository
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService,
) {
    @Transactional
    fun register(request: RegisterRequest): AuthResponse {
        if (userRepository.existsByUsername(request.username)) {
            throw AuthException(409, "Username already taken")
        }

        val user = UserEntity(
            username = request.username,
            passwordHash = passwordEncoder.encode(request.password),
        )
        userRepository.save(user)
        return buildAuthResponse(user.username)
    }

    fun login(request: LoginRequest): AuthResponse {
        val user = userRepository.findByUsername(request.username)
            .orElseThrow { AuthException(401, "Wrong login or password") }

        if (!passwordEncoder.matches(request.password, user.passwordHash)) {
            throw AuthException(401, "Wrong login or password")
        }

        return buildAuthResponse(user.username)
    }

    fun profile(username: String): UserProfileResponse {
        userRepository.findByUsername(username)
            .orElseThrow { AuthException(401, "Unauthorized") }
        return UserProfileResponse(username)
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
