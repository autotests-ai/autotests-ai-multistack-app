package dev.multistack.app.service

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

@DisplayName("PasswordHasher")
class PasswordHasherTest {

    private val hasher = PasswordHasher()

    @Test
    @DisplayName("hash produces a bcrypt digest, not the raw password")
    fun hashIsBcrypt() {
        val hash = hasher.hash("password1")

        assertTrue(hash.startsWith("\$2"))
        assertFalse(hash.contains("password1"))
    }

    @Test
    @DisplayName("matches verifies the same password and rejects a wrong one")
    fun matchesRoundtrip() {
        val hash = hasher.hash("password1")

        assertTrue(hasher.matches("password1", hash))
        assertFalse(hasher.matches("password2", hash))
    }
}
