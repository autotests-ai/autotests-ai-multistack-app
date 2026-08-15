package dev.multistack.app.service

import dev.multistack.app.dto.LoginRequest
import dev.multistack.app.dto.RegisterRequest
import dev.multistack.app.entity.UserEntity
import dev.multistack.app.exception.AuthException
import dev.multistack.app.repository.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentCaptor
import org.mockito.ArgumentMatchers.any
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.security.crypto.password.PasswordEncoder
import java.util.Optional

@ExtendWith(MockitoExtension::class)
@DisplayName("AuthService")
class AuthServiceTest {
    @Mock
    private lateinit var userRepository: UserRepository

    @Mock
    private lateinit var passwordEncoder: PasswordEncoder

    @Mock
    private lateinit var jwtService: JwtService

    private lateinit var authService: AuthService

    @BeforeEach
    fun setUp() {
        authService = AuthService(userRepository, passwordEncoder, jwtService)
    }

    @Test
    @DisplayName("register saves user and returns auth response")
    fun registerCreatesUser() {
        val request = RegisterRequest("newuser", "password123")
        `when`(userRepository.existsByUsername("newuser")).thenReturn(false)
        `when`(passwordEncoder.encode("password123")).thenReturn(HASH)
        `when`(jwtService.createToken("newuser")).thenReturn(TOKEN)

        val response = authService.register(request)

        assertEquals(TOKEN, response.token)
        assertEquals("newuser", response.username)
        assertEquals("/", response.redirectUrl)

        val userCaptor = ArgumentCaptor.forClass(UserEntity::class.java)
        verify(userRepository).saveAndFlush(userCaptor.capture())
        assertEquals("newuser", userCaptor.value.username)
        assertEquals(HASH, userCaptor.value.passwordHash)
    }

    @Test
    @DisplayName("register rejects duplicate username")
    fun registerDuplicateUsername() {
        `when`(userRepository.existsByUsername(USERNAME)).thenReturn(true)

        val ex = assertThrows(AuthException::class.java) {
            authService.register(RegisterRequest(USERNAME, "password123"))
        }

        assertEquals(409, ex.status)
        assertEquals("Username already taken", ex.message)
    }

    @Test
    @DisplayName("register maps a lost unique-constraint race to 409")
    fun registerLosesUniqueConstraintRace() {
        `when`(userRepository.existsByUsername(USERNAME)).thenReturn(false)
        `when`(passwordEncoder.encode(PASSWORD)).thenReturn(HASH)
        `when`(userRepository.saveAndFlush(any(UserEntity::class.java)))
            .thenThrow(DataIntegrityViolationException("duplicate key value violates unique constraint"))

        val ex = assertThrows(AuthException::class.java) {
            authService.register(RegisterRequest(USERNAME, PASSWORD))
        }

        assertEquals(409, ex.status)
        assertEquals("Username already taken", ex.message)
    }

    @Test
    @DisplayName("login returns token for valid credentials")
    fun loginWithValidCredentials() {
        val user = UserEntity(username = USERNAME, passwordHash = HASH)
        `when`(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user))
        `when`(passwordEncoder.matches(PASSWORD, HASH)).thenReturn(true)
        `when`(jwtService.createToken(USERNAME)).thenReturn(TOKEN)

        val response = authService.login(LoginRequest(USERNAME, PASSWORD))

        assertEquals(TOKEN, response.token)
        assertEquals(USERNAME, response.username)
        assertEquals("/", response.redirectUrl)
    }

    @Test
    @DisplayName("login rejects unknown username")
    fun loginUnknownUser() {
        `when`(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty())

        val ex = assertThrows(AuthException::class.java) {
            authService.login(LoginRequest(USERNAME, PASSWORD))
        }

        assertEquals(401, ex.status)
        assertEquals("Wrong login or password", ex.message)
    }

    @Test
    @DisplayName("login rejects wrong password")
    fun loginWrongPassword() {
        val user = UserEntity(username = USERNAME, passwordHash = HASH)
        `when`(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user))
        `when`(passwordEncoder.matches(PASSWORD, HASH)).thenReturn(false)

        val ex = assertThrows(AuthException::class.java) {
            authService.login(LoginRequest(USERNAME, PASSWORD))
        }

        assertEquals(401, ex.status)
        assertEquals("Wrong login or password", ex.message)
    }

    @Test
    @DisplayName("profile returns username for existing user")
    fun profileForExistingUser() {
        val user = UserEntity(username = USERNAME, passwordHash = HASH)
        `when`(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user))

        val response = authService.profile(USERNAME)

        assertEquals(USERNAME, response.username)
    }

    @Test
    @DisplayName("profile rejects unknown username")
    fun profileUnknownUser() {
        `when`(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty())

        val ex = assertThrows(AuthException::class.java) {
            authService.profile(USERNAME)
        }

        assertEquals(401, ex.status)
        assertEquals("Unauthorized", ex.message)
    }

    @Test
    @DisplayName("deleteAccount removes the row of an existing user")
    fun deleteAccountRemovesUser() {
        val user = UserEntity(username = USERNAME, passwordHash = HASH)
        `when`(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user))

        authService.deleteAccount(USERNAME)

        verify(userRepository).delete(user)
    }

    @Test
    @DisplayName("deleteAccount rejects a token whose user is already gone")
    fun deleteAccountUnknownUser() {
        `when`(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty())

        val ex = assertThrows(AuthException::class.java) {
            authService.deleteAccount(USERNAME)
        }

        assertEquals(401, ex.status)
        assertEquals("Unauthorized", ex.message)
    }

    companion object {
        private const val USERNAME = "user1"
        private const val PASSWORD = "password1"
        private const val HASH = "encoded-hash"
        private const val TOKEN = "jwt-token"
    }
}
