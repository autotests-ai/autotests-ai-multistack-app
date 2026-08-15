package dev.multistack.app.entity

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

@DisplayName("UserEntity")
class UserEntityTest {
    @Test
    @DisplayName("constructor and getters expose user fields")
    fun constructorAndGettersExposeUserFields() {
        val user = UserEntity(id = 7L, username = "user1", passwordHash = "hash")

        assertEquals(7L, user.id)
        assertEquals("user1", user.username)
        assertEquals("hash", user.passwordHash)
        assertNotNull(user.createdAt)
    }

    @Test
    @DisplayName("no-args constructor initializes createdAt")
    fun noArgsConstructorInitializesCreatedAt() {
        val user = UserEntity()

        assertNull(user.id)
        assertTrue(user.username.isEmpty())
        assertTrue(user.passwordHash.isEmpty())
        assertNotNull(user.createdAt)
    }
}
