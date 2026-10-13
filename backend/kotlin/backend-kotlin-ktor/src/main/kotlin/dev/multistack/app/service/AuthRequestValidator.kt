package dev.multistack.app.service

import dev.multistack.app.exception.ValidationException

/**
 * Bean-validation analogue: same field names, order and message templates the Spring modules
 * produce from `@NotBlank`/`@Size` (`"<field> must not be blank"`,
 * `"<field> size must be between <min> and <max>"`), joined with `"; "`.
 */
object AuthRequestValidator {
    fun assertValid(username: String, password: String) {
        val errors = mutableListOf<String>()
        if (username.isBlank()) errors += "username must not be blank"
        if (username.length < 3 || username.length > 64) errors += "username size must be between 3 and 64"
        if (password.isBlank()) errors += "password must not be blank"
        if (password.length < 6 || password.length > 128) errors += "password size must be between 6 and 128"
        if (errors.isNotEmpty()) throw ValidationException(errors.joinToString("; "))
    }
}
