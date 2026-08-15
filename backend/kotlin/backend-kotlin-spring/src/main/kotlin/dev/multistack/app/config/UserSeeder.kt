package dev.multistack.app.config

import dev.multistack.app.entity.UserEntity
import dev.multistack.app.repository.UserRepository
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component

@Component
class UserSeeder(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) {
        if (!userRepository.existsByUsername(SEED_USERNAME)) {
            userRepository.save(
                UserEntity(
                    username = SEED_USERNAME,
                    passwordHash = passwordEncoder.encode(SEED_PASSWORD),
                ),
            )
        }
    }

    companion object {
        private const val SEED_USERNAME = "user1"
        private const val SEED_PASSWORD = "password1"
    }
}
