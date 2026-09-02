namespace Helpers;

/// <summary>Throwaway test identity for register / delete-account.</summary>
public sealed record User(string Username, string Password)
{
    public string WelcomeMessage() => $"Welcome, {Username}!";
}

/// <summary>Throwaway test identity. Faker methods are for register / delete-account.</summary>
public sealed class UserBuilder
{
    private string _username = "";
    private string _password = "";

    public UserBuilder WithUsername()
    {
        _username = DataFaker.Username();
        return this;
    }

    public UserBuilder WithPassword()
    {
        _password = DataFaker.Password();
        return this;
    }

    public User Build() => new(_username, _password);
}
