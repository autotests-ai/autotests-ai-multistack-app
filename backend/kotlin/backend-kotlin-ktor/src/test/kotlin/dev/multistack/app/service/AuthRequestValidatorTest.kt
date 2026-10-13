package dev.multistack.app.service

import dev.multistack.app.exception.ValidationException
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

@DisplayName("AuthRequestValidator")
class AuthRequestValidatorTest {

    @Test
    @DisplayName("accepts boundary-valid credentials")
    fun acceptsValid() {
        assertDoesNotThrow { AuthRequestValidator.assertValid("abc", "123456") }
        assertDoesNotThrow { AuthRequestValidator.assertValid("u".repeat(64), "p".repeat(128)) }
    }

    @Test
    @DisplayName("rejects a blank username with the Spring message")
    fun rejectsBlankUsername() {
        val ex = assertThrows(ValidationException::class.java) {
            AuthRequestValidator.assertValid("", "password1")
        }
        assertEquals(
            "username must not be blank; username size must be between 3 and 64",
            ex.message,
        )
    }

    @Test
    @DisplayName("rejects a short username")
    fun rejectsShortUsername() {
        val ex = assertThrows(ValidationException::class.java) {
            AuthRequestValidator.assertValid("ab", "password1")
        }
        assertEquals("username size must be between 3 and 64", ex.message)
    }

    @Test
    @DisplayName("rejects a short password")
    fun rejectsShortPassword() {
        val ex = assertThrows(ValidationException::class.java) {
            AuthRequestValidator.assertValid("user1", "123")
        }
        assertEquals("password size must be between 6 and 128", ex.message)
    }

    @Test
    @DisplayName("joins both field errors into one message")
    fun joinsBothErrors() {
        val ex = assertThrows(ValidationException::class.java) {
            AuthRequestValidator.assertValid("", "")
        }
        assertEquals(
            "username must not be blank; username size must be between 3 and 64; " +
                "password must not be blank; password size must be between 6 and 128",
            ex.message,
        )
    }
}
