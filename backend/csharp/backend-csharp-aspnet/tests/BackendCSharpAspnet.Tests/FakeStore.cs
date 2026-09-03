using Dev.Multistack.App.Store;

namespace BackendCSharpAspnet.Tests;

/// <summary>
/// In-memory <see cref="IStore"/>. Any of the *Error fields short-circuits the matching
/// method, which is how tests exercise the 500 paths.
/// </summary>
public sealed class FakeStore : IStore
{
    public List<Item> Items { get; } = [];
    public List<User> Users { get; } = [];

    public Exception? ListItemsError { get; set; }
    public Exception? CountItemsError { get; set; }
    public Exception? InsertItemError { get; set; }
    public Exception? FindUserError { get; set; }
    public Exception? CreateUserError { get; set; }
    public Exception? DeleteUserError { get; set; }

    private long _nextItemId;
    private long _nextUserId;

    public FakeStore WithItem(string name, string description)
    {
        _nextItemId++;
        Items.Add(new Item(_nextItemId, name, description));
        return this;
    }

    public FakeStore WithUser(string username, string passwordHash)
    {
        _nextUserId++;
        Users.Add(new User(_nextUserId, username, passwordHash));
        return this;
    }

    public Task<IReadOnlyList<Item>> ListItemsAsync(CancellationToken cancellationToken)
    {
        if (ListItemsError is not null)
        {
            throw ListItemsError;
        }

        return Task.FromResult<IReadOnlyList<Item>>(Items.ToList());
    }

    public Task<long> CountItemsAsync(CancellationToken cancellationToken)
    {
        if (CountItemsError is not null)
        {
            throw CountItemsError;
        }

        return Task.FromResult((long)Items.Count);
    }

    public Task InsertItemAsync(string name, string description, CancellationToken cancellationToken)
    {
        if (InsertItemError is not null)
        {
            throw InsertItemError;
        }

        WithItem(name, description);
        return Task.CompletedTask;
    }

    public Task<User> FindUserByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        if (FindUserError is not null)
        {
            throw FindUserError;
        }

        var user = Users.FirstOrDefault(candidate => candidate.Username == username);
        if (user is null)
        {
            throw new UserNotFoundException();
        }

        return Task.FromResult(user);
    }

    public Task<User> CreateUserAsync(string username, string passwordHash, CancellationToken cancellationToken)
    {
        if (CreateUserError is not null)
        {
            throw CreateUserError;
        }

        if (Users.Any(candidate => candidate.Username == username))
        {
            throw new DuplicateUsernameException();
        }

        WithUser(username, passwordHash);
        return Task.FromResult(Users[^1]);
    }

    public Task DeleteUserAsync(string username, CancellationToken cancellationToken)
    {
        if (DeleteUserError is not null)
        {
            throw DeleteUserError;
        }

        Users.RemoveAll(user => user.Username == username);
        return Task.CompletedTask;
    }
}
