package api.model;

/** Request body for {@code POST /api/auth/register} — serialized by Retrofit Jackson. */
public record RegisterRequest(String username, String password) {
}
