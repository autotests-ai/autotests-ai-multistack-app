package helpers;

/** Throwaway identity for login min-length setup (same shape as the web cell). */
public record User(String username, String password) {

    public String welcomeMessage() {
        return "Welcome, " + username + "!";
    }
}
