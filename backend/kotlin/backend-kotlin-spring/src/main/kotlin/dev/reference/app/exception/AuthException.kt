package dev.reference.app.exception

class AuthException(
    val status: Int,
    message: String,
) : RuntimeException(message)
