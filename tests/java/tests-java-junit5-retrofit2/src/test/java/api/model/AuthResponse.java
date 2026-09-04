package api.model;

public record AuthResponse(String token, String username, String redirectUrl) {
}
