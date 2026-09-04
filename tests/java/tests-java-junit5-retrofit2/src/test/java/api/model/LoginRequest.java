package api.model;

/** Request body for {@code POST /api/auth/login} — serialized by Retrofit Jackson. */
public record LoginRequest(String username, String password) {
}
