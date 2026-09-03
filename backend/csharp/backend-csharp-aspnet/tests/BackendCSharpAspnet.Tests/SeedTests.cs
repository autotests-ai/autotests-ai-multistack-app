using Dev.Multistack.App.Store;
using Xunit;

namespace BackendCSharpAspnet.Tests;

public sealed class SeedTests
{
    private static string HashStub(string password) => "hash:" + password;

    [Fact]
    public async Task FillsEmptyDatabase()
    {
        var fake = new FakeStore();
        await Seed.ApplyAsync(fake, HashStub);
        Assert.Equal(Seed.Items.Length, fake.Items.Count);
        for (var i = 0; i < Seed.Items.Length; i++)
        {
            Assert.Equal(Seed.Items[i].Name, fake.Items[i].Name);
            Assert.Equal(Seed.Items[i].Description, fake.Items[i].Description);
        }

        Assert.Equal("Third item — multistack bootstrap", fake.Items[2].Description);
        var user = await fake.FindUserByUsernameAsync(Seed.Username, CancellationToken.None);
        Assert.Equal("hash:" + Seed.Password, user.PasswordHash);
    }

    [Fact]
    public async Task IsIdempotent()
    {
        var fake = new FakeStore();
        await Seed.ApplyAsync(fake, HashStub);
        await Seed.ApplyAsync(fake, HashStub);
        Assert.Equal(Seed.Items.Length, fake.Items.Count);
        Assert.Single(fake.Users);
    }

    [Fact]
    public async Task KeepsExistingItems()
    {
        var fake = new FakeStore().WithItem("Custom", "Left alone");
        await Seed.ApplyAsync(fake, HashStub);
        Assert.Single(fake.Items);
    }

    [Fact]
    public async Task ToleratesLostRace()
    {
        var fake = new FakeStore { CreateUserError = new DuplicateUsernameException() };
        await Seed.ApplyAsync(fake, HashStub);
    }

    [Fact]
    public async Task PropagatesCountError()
    {
        var failure = new InvalidOperationException("db down");
        var fake = new FakeStore { CountItemsError = failure };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => Seed.ApplyAsync(fake, HashStub));
        Assert.Same(failure, ex);
    }

    [Fact]
    public async Task PropagatesInsertError()
    {
        var failure = new InvalidOperationException("db down");
        var fake = new FakeStore { InsertItemError = failure };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => Seed.ApplyAsync(fake, HashStub));
        Assert.Same(failure, ex);
    }

    [Fact]
    public async Task PropagatesFindError()
    {
        var failure = new InvalidOperationException("db down");
        var fake = new FakeStore { FindUserError = failure };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => Seed.ApplyAsync(fake, HashStub));
        Assert.Same(failure, ex);
    }

    [Fact]
    public async Task PropagatesCreateError()
    {
        var failure = new InvalidOperationException("db down");
        var fake = new FakeStore { CreateUserError = failure };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => Seed.ApplyAsync(fake, HashStub));
        Assert.Same(failure, ex);
    }

    [Fact]
    public async Task PropagatesHashFailure()
    {
        var failure = new InvalidOperationException("bcrypt refused");
        string Hash(string _) => throw failure;
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => Seed.ApplyAsync(new FakeStore(), Hash));
        Assert.Same(failure, ex);
    }
}
