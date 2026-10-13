package dev.multistack.app.config

import dev.multistack.app.db.UserRepository
import dev.multistack.app.service.PasswordHasher
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.argThat
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

@DisplayName("UserSeeder")
class UserSeederTest {

    private val userRepository = mock<UserRepository>()
    private val passwordHasher = PasswordHasher()
    private val seeder = UserSeeder(userRepository, passwordHasher)

    @Test
    @DisplayName("inserts user1 with a bcrypt hash when the account is absent")
    fun insertsSeedUser() {
        whenever(userRepository.existsByUsername("user1")).thenReturn(false)

        seeder.seed()

        verify(userRepository).insert(
            eq("user1"),
            argThat { startsWith("\$2a\$") || startsWith("\$2b\$") },
        )
    }

    @Test
    @DisplayName("does nothing when user1 already exists")
    fun skipsExistingSeedUser() {
        whenever(userRepository.existsByUsername("user1")).thenReturn(true)

        seeder.seed()

        verify(userRepository, never()).insert(any(), any())
    }
}
