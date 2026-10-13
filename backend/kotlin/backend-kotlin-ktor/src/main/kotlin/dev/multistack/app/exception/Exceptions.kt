package dev.multistack.app.exception

class AuthException(
    val status: Int,
    message: String,
) : RuntimeException(message)

/** Bean-validation analogue — carries the already-joined `"; "`-separated field errors. */
class ValidationException(
    message: String,
) : RuntimeException(message)
