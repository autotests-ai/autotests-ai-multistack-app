package dev.multistack.app.service

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import java.time.Instant

@DisplayName("JwtService")
class JwtServiceTest {
    private lateinit var jwtService: JwtService

    @BeforeEach
    fun setUp() {
        jwtService = JwtService(SECRET, 3_600_000L)
    }

    @Test
    @DisplayName("createToken and extractUsername roundtrip")
    fun tokenRoundtrip() {
        val token = jwtService.createToken("user1")

        assertEquals("user1", jwtService.extractUsername(token))
        assertTrue(jwtService.isValid(token))
    }

    @Test
    @DisplayName("isValid rejects tampered token")
    fun isValidRejectsTamperedToken() {
        val token = jwtService.createToken("user1")

        assertFalse(jwtService.isValid(token + "tampered"))
    }

    @Test
    @DisplayName("isValid rejects malformed token")
    fun isValidRejectsMalformedToken() {
        assertFalse(jwtService.isValid("not-a-jwt"))
    }

    @Test
    @DisplayName("isValid rejects expired token")
    fun isValidRejectsExpiredToken() {
        val past = Instant.now().minusSeconds(60)
        val expiredToken = JWT.create()
            .withSubject("user1")
            .withIssuedAt(past.minusSeconds(60))
            .withExpiresAt(past)
            .sign(Algorithm.HMAC256(SECRET))

        assertFalse(jwtService.isValid(expiredToken))
    }

    private companion object {
        const val SECRET = "test-secret-test-secret-test-secret-32"
    }
}
