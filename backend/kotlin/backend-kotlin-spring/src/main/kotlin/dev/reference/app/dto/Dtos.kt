package dev.reference.app.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class UserProfileResponse(
    val username: String,
)

data class ItemsResponse(
    val items: List<ItemDto>,
    val source: String,
)

data class RegisterRequest(
    @field:NotBlank @field:Size(min = 3, max = 64) val username: String,
    @field:NotBlank @field:Size(min = 6, max = 128) val password: String,
)

data class HealthResponse(
    val status: String,
    val service: String,
)

data class AuthResponse(
    val token: String,
    val username: String,
    val redirectUrl: String,
)

data class LoginRequest(
    @field:NotBlank @field:Size(min = 3, max = 64) val username: String,
    @field:NotBlank @field:Size(min = 6, max = 128) val password: String,
)

data class ItemDto(
    val id: Long,
    val name: String,
    val description: String,
)
