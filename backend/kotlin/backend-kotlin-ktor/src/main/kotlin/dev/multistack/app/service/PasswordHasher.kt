package dev.multistack.app.service

import at.favre.lib.crypto.bcrypt.BCrypt

/**
 * BCrypt password hashing — standalone `at.favre.lib:bcrypt` instead of
 * `spring-security-crypto`; cost 10 matches `BCryptPasswordEncoder`'s default.
 */
class PasswordHasher {
    fun hash(rawPassword: String): String =
        BCrypt.withDefaults().hashToString(COST, rawPassword.toCharArray())

    fun matches(rawPassword: String, hash: String): Boolean =
        BCrypt.verifyer().verify(rawPassword.toCharArray(), hash).verified

    companion object {
        private const val COST = 10
    }
}
