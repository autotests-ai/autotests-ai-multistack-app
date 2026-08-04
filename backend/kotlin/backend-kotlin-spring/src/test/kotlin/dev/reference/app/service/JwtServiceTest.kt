package dev.reference.app.service

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.util.Date

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
        val expiredToken = Jwts.builder()
            .subject("user1")
            .issuedAt(Date.from(past.minusSeconds(60)))
            .expiration(Date.from(past))
            .signWith(Keys.hmacShaKeyFor(SECRET.toByteArray(StandardCharsets.UTF_8)))
            .compact()

        assertFalse(jwtService.isValid(expiredToken))
    }

    companion object {
        private const val SECRET = "reference-app-dev-secret-change-in-production-min-32-chars"
    }
}
