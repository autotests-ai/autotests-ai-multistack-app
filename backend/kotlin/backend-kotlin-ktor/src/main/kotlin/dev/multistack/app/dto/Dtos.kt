package dev.multistack.app.dto

import kotlinx.serialization.Serializable

@Serializable
data class UserProfileResponse(
    val username: String,
)

@Serializable
data class ItemsResponse(
    val items: List<ItemDto>,
    val source: String,
)

@Serializable
data class RegisterRequest(
    val username: String,
    val password: String,
)

@Serializable
data class HealthResponse(
    val status: String,
    val service: String,
)

@Serializable
data class AuthResponse(
    val token: String,
    val username: String,
    val redirectUrl: String,
)

@Serializable
data class LoginRequest(
    val username: String,
    val password: String,
)

@Serializable
data class ItemDto(
    val id: Long,
    val name: String,
    val description: String,
)

@Serializable
data class ErrorResponse(
    val message: String,
)
