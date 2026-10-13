package dev.multistack.app.service

import com.auth0.jwt.JWT
import com.auth0.jwt.JWTVerifier
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.exceptions.JWTVerificationException
import java.time.Instant

/**
 * HMAC256 JWT — auth0/java-jwt is what `ktor-server-auth-jwt` wraps anyway, so the
 * same [verifier] backs both token creation here and the Authentication plugin.
 */
class JwtService(
    secret: String,
    private val expirationMs: Long,
) {
    private val algorithm: Algorithm = Algorithm.HMAC256(secret)
    val verifier: JWTVerifier = JWT.require(algorithm).build()

    fun createToken(username: String): String {
        val now = Instant.now()
        return JWT.create()
            .withSubject(username)
            .withIssuedAt(now)
            .withExpiresAt(now.plusMillis(expirationMs))
            .sign(algorithm)
    }

    fun extractUsername(token: String): String = verifier.verify(token).subject

    fun isValid(token: String): Boolean =
        try {
            verifier.verify(token)
            true
        } catch (_: JWTVerificationException) {
            false
        }
}
