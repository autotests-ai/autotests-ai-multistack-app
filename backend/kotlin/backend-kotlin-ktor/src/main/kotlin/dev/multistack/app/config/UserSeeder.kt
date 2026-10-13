package dev.multistack.app.config

import dev.multistack.app.db.UserRepository
import dev.multistack.app.service.PasswordHasher

/** Seeds the demo account so a fresh stand accepts `user1` / `password1` — same as `UserSeeder` in Spring. */
class UserSeeder(
    private val userRepository: UserRepository,
    private val passwordHasher: PasswordHasher,
) {
    fun seed() {
        if (!userRepository.existsByUsername(SEED_USERNAME)) {
            userRepository.insert(SEED_USERNAME, passwordHasher.hash(SEED_PASSWORD))
        }
    }

    companion object {
        private const val SEED_USERNAME = "user1"
        private const val SEED_PASSWORD = "password1"
    }
}
