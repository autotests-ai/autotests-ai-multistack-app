package helpers;

/**
 * Test identity. Seeded stand account — {@link UserBuilder#withSeededUser()};
 * throwaway — {@link UserBuilder#withUsername()} / {@link UserBuilder#withPassword()}.
 */
public record User(String username, String password) {

    public String welcomeMessage() {
        return "Welcome, " + username + "!";
    }
}
