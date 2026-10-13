package dev.multistack.app.service

import dev.multistack.app.db.UserRecord
import dev.multistack.app.db.UserRepository
import dev.multistack.app.dto.LoginRequest
import dev.multistack.app.dto.RegisterRequest
import dev.multistack.app.exception.AuthException
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

@DisplayName("AuthService")
class AuthServiceTest {

    private val userRepository = mock<UserRepository>()
    private val passwordHasher = mock<PasswordHasher>()
    private val jwtService = mock<JwtService>()

    private lateinit var service: AuthService

    @BeforeEach
    fun setUp() {
        service = AuthService(userRepository, passwordHasher, jwtService)
        whenever(jwtService.createToken(any())).thenReturn("token")
    }

    @Test
    @DisplayName("register creates the user and returns token + redirectUrl")
    fun registerCreatesUser() {
        whenever(userRepository.existsByUsername("newuser")).thenReturn(false)
        whenever(passwordHasher.hash("password123")).thenReturn("hash")
        whenever(userRepository.insert("newuser", "hash")).thenReturn(true)

        val response = service.register(RegisterRequest("newuser", "password123"))

        assertEquals("newuser", response.username)
        assertEquals("token", response.token)
        assertEquals("/", response.redirectUrl)
        verify(userRepository).insert("newuser", "hash")
    }

    @Test
    @DisplayName("register answers 409 when the username is taken")
    fun registerRejectsTakenUsername() {
        whenever(userRepository.existsByUsername("user1")).thenReturn(true)

        val ex = assertThrows(AuthException::class.java) {
            service.register(RegisterRequest("user1", "password123"))
        }
        assertEquals(409, ex.status)
        assertEquals("Username already taken", ex.message)
        verify(userRepository, never()).insert(any(), any())
    }

    @Test
    @DisplayName("register answers 409 on a lost insert race (unique violation)")
    fun registerRejectsInsertRace() {
        whenever(userRepository.existsByUsername("racer")).thenReturn(false)
        whenever(passwordHasher.hash(any())).thenReturn("hash")
        whenever(userRepository.insert("racer", "hash")).thenReturn(false)

        val ex = assertThrows(AuthException::class.java) {
            service.register(RegisterRequest("racer", "password123"))
        }
        assertEquals(409, ex.status)
        assertEquals("Username already taken", ex.message)
    }

    @Test
    @DisplayName("login returns a token for valid credentials")
    fun loginReturnsToken() {
        whenever(userRepository.findByUsername("user1"))
            .thenReturn(UserRecord(1L, "user1", "hash"))
        whenever(passwordHasher.matches("password1", "hash")).thenReturn(true)

        val response = service.login(LoginRequest("user1", "password1"))

        assertEquals("token", response.token)
        assertEquals("user1", response.username)
    }

    @Test
    @DisplayName("login answers 401 for an unknown user")
    fun loginRejectsUnknownUser() {
        whenever(userRepository.findByUsername("ghost")).thenReturn(null)

        val ex = assertThrows(AuthException::class.java) {
            service.login(LoginRequest("ghost", "password1"))
        }
        assertEquals(401, ex.status)
        assertEquals("Wrong login or password", ex.message)
    }

    @Test
    @DisplayName("login answers the same 401 for a wrong password (no enumeration)")
    fun loginRejectsWrongPassword() {
        whenever(userRepository.findByUsername("user1"))
            .thenReturn(UserRecord(1L, "user1", "hash"))
        whenever(passwordHasher.matches("wrong", "hash")).thenReturn(false)

        val ex = assertThrows(AuthException::class.java) {
            service.login(LoginRequest("user1", "wrong"))
        }
        assertEquals(401, ex.status)
        assertEquals("Wrong login or password", ex.message)
    }

    @Test
    @DisplayName("profile returns the username for an existing account")
    fun profileReturnsUsername() {
        whenever(userRepository.findByUsername("user1"))
            .thenReturn(UserRecord(1L, "user1", "hash"))

        assertEquals("user1", service.profile("user1").username)
    }

    @Test
    @DisplayName("profile answers 401 when the account is gone")
    fun profileRejectsMissingAccount() {
        whenever(userRepository.findByUsername("ghost")).thenReturn(null)

        val ex = assertThrows(AuthException::class.java) {
            service.profile("ghost")
        }
        assertEquals(401, ex.status)
        assertEquals("Unauthorized", ex.message)
    }

    @Test
    @DisplayName("deleteAccount removes the row for an existing account")
    fun deleteAccountRemovesRow() {
        whenever(userRepository.findByUsername("user1"))
            .thenReturn(UserRecord(7L, "user1", "hash"))

        service.deleteAccount("user1")

        verify(userRepository).deleteById(eq(7L))
    }

    @Test
    @DisplayName("deleteAccount answers 401 when the account is gone")
    fun deleteAccountRejectsMissingAccount() {
        whenever(userRepository.findByUsername("ghost")).thenReturn(null)

        val ex = assertThrows(AuthException::class.java) {
            service.deleteAccount("ghost")
        }
        assertEquals(401, ex.status)
        verify(userRepository, never()).deleteById(any())
    }
}
