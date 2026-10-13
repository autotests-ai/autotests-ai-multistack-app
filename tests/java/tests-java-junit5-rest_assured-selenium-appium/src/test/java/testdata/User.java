package testdata;

/** Throwaway test identity for register / delete-account (same shape as the web cell). */
public record User(String username, String password) {

    public String welcomeMessage() {
        return "Welcome, " + username + "!";
    }
}
