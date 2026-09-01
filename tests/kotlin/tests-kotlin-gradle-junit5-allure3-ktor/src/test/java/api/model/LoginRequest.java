package api.model;

/** Request body for {@code POST /api/auth/login} — serialized by Jackson for Ktor. */
public record LoginRequest(String username, String password) {
}
