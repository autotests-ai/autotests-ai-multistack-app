package helpers;

/**
 * User data for tests. {@link #withSeededUser()} is the stand account that exists
 * on every env; faker methods are for register / throwaway only.
 */
public final class UserBuilder {

    private String username;
    private String password;

    public UserBuilder withUsername() {
        this.username = DataFaker.username();
        return this;
    }

    public UserBuilder withPassword() {
        this.password = DataFaker.password();
        return this;
    }

    /** Seeded demo user on the teaching stack ({@code user1} / {@code password1}). */
    public UserBuilder withSeededUser() {
        this.username = "user1";
        this.password = "password1";
        return this;
    }

    public User build() {
        return new User(username, password);
    }
}
