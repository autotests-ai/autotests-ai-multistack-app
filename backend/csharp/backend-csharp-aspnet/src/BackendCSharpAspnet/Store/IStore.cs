namespace Dev.Multistack.App.Store;

public sealed class UserNotFoundException : Exception
{
    public UserNotFoundException()
        : base("user not found")
    {
    }
}

public sealed class DuplicateUsernameException : Exception
{
    public DuplicateUsernameException()
        : base("duplicate username")
    {
    }
}

public sealed record Item(long Id, string Name, string Description);

public sealed record User(long Id, string Username, string PasswordHash);

/// <summary>Persistence contract used by the handlers and by the seeder.</summary>
public interface IStore
{
    Task<IReadOnlyList<Item>> ListItemsAsync(CancellationToken cancellationToken);
    Task<long> CountItemsAsync(CancellationToken cancellationToken);
    Task InsertItemAsync(string name, string description, CancellationToken cancellationToken);
    Task<User> FindUserByUsernameAsync(string username, CancellationToken cancellationToken);
    Task<User> CreateUserAsync(string username, string passwordHash, CancellationToken cancellationToken);
    Task DeleteUserAsync(string username, CancellationToken cancellationToken);
}
