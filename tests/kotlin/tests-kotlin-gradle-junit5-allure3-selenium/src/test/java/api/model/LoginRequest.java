package api.model;

/** Request body for {@code POST /api/auth/login} — serialized by Jackson for the in-cell Ktor client. */
public record LoginRequest(String username, String password) {
}
