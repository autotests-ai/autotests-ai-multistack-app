using Dev.Multistack.App.Store;
using Xunit;

namespace BackendCSharpAspnet.Tests;

public sealed class PostgresStoreTests
{
    private static bool PostgresAvailable =>
        !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("TEST_DATABASE_URL"));

    private static async Task<(PostgresStore Store, CancellationToken Ct)> OpenAsync()
    {
        var pg = PostgresStore.Open(Environment.GetEnvironmentVariable("TEST_DATABASE_URL")!);
        var ct = CancellationToken.None;
        await pg.WaitReadyAsync(TimeSpan.FromSeconds(30), ct);
        await pg.ApplySchemaAsync(SchemaSql.ReadFromOutput(), ct);
        return (pg, ct);
    }

    [Fact]
    public async Task Items()
    {
        if (!PostgresAvailable)
        {
            return;
        }

        var (pg, ct) = await OpenAsync();
        await using var store = pg;
        var before = await store.CountItemsAsync(ct);
        var name = $"Item-{DateTime.UtcNow.Ticks}";
        await store.InsertItemAsync(name, "inserted by the integration test", ct);
        var after = await store.CountItemsAsync(ct);
        Assert.Equal(before + 1, after);
        var items = await store.ListItemsAsync(ct);
        Assert.Equal(after, items.Count);
        for (var i = 1; i < items.Count; i++)
        {
            Assert.True(items[i - 1].Id < items[i].Id);
        }

        Assert.Equal(name, items[^1].Name);
    }

    [Fact]
    public async Task Users()
    {
        if (!PostgresAvailable)
        {
            return;
        }

        var (pg, ct) = await OpenAsync();
        await using var store = pg;
        var username = $"integration-{DateTime.UtcNow.Ticks}";
        var created = await store.CreateUserAsync(username, "hash", ct);
        Assert.NotEqual(0, created.Id);
        var found = await store.FindUserByUsernameAsync(username, ct);
        Assert.Equal(created.Id, found.Id);
        Assert.Equal("hash", found.PasswordHash);
        await Assert.ThrowsAsync<DuplicateUsernameException>(() => store.CreateUserAsync(username, "hash", ct));
        await Assert.ThrowsAsync<UserNotFoundException>(() => store.FindUserByUsernameAsync(username + "-missing", ct));
        await store.DeleteUserAsync(username, ct);
        await Assert.ThrowsAsync<UserNotFoundException>(() => store.FindUserByUsernameAsync(username, ct));
        await store.DeleteUserAsync(username, ct);
    }

    [Fact]
    public async Task SeedIsIdempotent()
    {
        if (!PostgresAvailable)
        {
            return;
        }

        var (pg, ct) = await OpenAsync();
        await using var store = pg;
        string Hash(string password) => "hash:" + password;
        await Seed.ApplyAsync(store, Hash, ct);
        var first = await store.CountItemsAsync(ct);
        await Seed.ApplyAsync(store, Hash, ct);
        var second = await store.CountItemsAsync(ct);
        Assert.Equal(first, second);
        await store.FindUserByUsernameAsync(Seed.Username, ct);
    }
}
