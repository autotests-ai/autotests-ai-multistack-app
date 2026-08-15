package dev.multistack.app.config

import dev.multistack.app.entity.UserEntity
import dev.multistack.app.repository.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentCaptor
import org.mockito.ArgumentMatchers.any
import org.mockito.Mock
import org.mockito.Mockito.mock
import org.mockito.Mockito.never
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.boot.ApplicationArguments
import org.springframework.security.crypto.password.PasswordEncoder

@ExtendWith(MockitoExtension::class)
@DisplayName("UserSeeder")
class UserSeederTest {
    @Mock
    private lateinit var userRepository: UserRepository

    @Mock
    private lateinit var passwordEncoder: PasswordEncoder

    private lateinit var userSeeder: UserSeeder

    @BeforeEach
    fun setUp() {
        userSeeder = UserSeeder(userRepository, passwordEncoder)
    }

    @Test
    @DisplayName("creates seed user when missing")
    fun createsSeedUserWhenMissing() {
        `when`(userRepository.existsByUsername("user1")).thenReturn(false)
        `when`(passwordEncoder.encode("password1")).thenReturn("encoded-hash")

        userSeeder.run(mock(ApplicationArguments::class.java))

        val userCaptor = ArgumentCaptor.forClass(UserEntity::class.java)
        verify(userRepository).save(userCaptor.capture())
        assertEquals("user1", userCaptor.value.username)
        assertEquals("encoded-hash", userCaptor.value.passwordHash)
    }

    @Test
    @DisplayName("skips seeding when user already exists")
    fun skipsSeedingWhenUserExists() {
        `when`(userRepository.existsByUsername("user1")).thenReturn(true)

        userSeeder.run(mock(ApplicationArguments::class.java))

        verify(userRepository, never()).save(any())
    }
}
