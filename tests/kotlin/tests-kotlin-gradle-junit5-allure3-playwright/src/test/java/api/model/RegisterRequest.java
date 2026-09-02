package api.model;

/** Request body for {@code POST /api/auth/register} — serialized by Jackson for Ktor. */
public record RegisterRequest(String username, String password) {
}
