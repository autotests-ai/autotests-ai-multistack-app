namespace Dev.Multistack.App.Store;

/// <summary>
/// Idempotent seed: items are only written into an empty table and the demo user only
/// when absent, so restarts never duplicate rows.
/// </summary>
public static class Seed
{
    public const string Username = "user1";
    public const string Password = "password1";

    /// <summary>Must stay byte-for-byte identical to the other backends, em-dash included.</summary>
    public static readonly Item[] Items =
    [
        new(0, "Alpha", "First seeded item from PostgreSQL"),
        new(0, "Beta", "Second seeded item for demo API"),
        new(0, "Gamma", "Third item — multistack bootstrap"),
    ];

    public static async Task ApplyAsync(
        IStore store,
        Func<string, string> hash,
        CancellationToken cancellationToken = default)
    {
        var count = await store.CountItemsAsync(cancellationToken);
        if (count == 0)
        {
            foreach (var item in Items)
            {
                await store.InsertItemAsync(item.Name, item.Description, cancellationToken);
            }
        }

        try
        {
            await store.FindUserByUsernameAsync(Username, cancellationToken);
            return;
        }
        catch (UserNotFoundException)
        {
            // seed below
        }

        var passwordHash = hash(Password);
        try
        {
            await store.CreateUserAsync(Username, passwordHash, cancellationToken);
        }
        catch (DuplicateUsernameException)
        {
            // A parallel replica may have inserted the same user; that is not a failure.
        }
    }
}
