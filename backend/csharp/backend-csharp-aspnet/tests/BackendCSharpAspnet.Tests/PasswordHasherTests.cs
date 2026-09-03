using Dev.Multistack.App.Security;
using Xunit;

namespace BackendCSharpAspnet.Tests;

public sealed class PasswordHasherTests
{
    [Fact]
    public void RoundTrip()
    {
        var hash = PasswordHasher.Hash("password1");
        Assert.NotEqual("password1", hash);
        Assert.StartsWith("$2", hash);
        Assert.True(PasswordHasher.Check("password1", hash));
        Assert.False(PasswordHasher.Check("password2", hash));
    }

    [Fact]
    public void IsSalted()
    {
        Assert.NotEqual(PasswordHasher.Hash("password1"), PasswordHasher.Hash("password1"));
    }

    [Fact]
    public void RejectsGarbageHash()
    {
        Assert.False(PasswordHasher.Check("password1", "not-a-bcrypt-hash"));
    }

    [Fact]
    public void BeyondBcryptInputLimit()
    {
        var longPassword = new string('p', 100);
        var hash = PasswordHasher.Hash(longPassword);
        Assert.True(PasswordHasher.Check(longPassword, hash));
        Assert.False(PasswordHasher.Check(new string('q', 100), hash));
    }

    [Fact]
    public void IgnoresBytesPastTheLimit()
    {
        var prefix = new string('p', 72);
        var hash = PasswordHasher.Hash(prefix + "-original-tail");
        Assert.True(PasswordHasher.Check(prefix + "-a-completely-different-tail", hash));
        Assert.True(PasswordHasher.Check(prefix, hash));
        Assert.False(PasswordHasher.Check(new string('q', 72) + "-original-tail", hash));
    }

    [Fact]
    public void Exactly72Utf8BytesRoundTrip()
    {
        AssertRoundTrip(string.Concat(Enumerable.Repeat("é", 36)));
    }

    [Fact]
    public void CutThatWouldSplitARuneStillRoundTrips()
    {
        AssertRoundTrip(new string('a', 71) + string.Concat(Enumerable.Repeat("é", 5)));
    }

    [Fact]
    public void LongCyrillicPasswordRoundTrips()
    {
        AssertRoundTrip(string.Concat(Enumerable.Repeat("пароль", 20)));
    }

    [Fact]
    public void EmojiPasswordRoundTrips()
    {
        AssertRoundTrip(string.Concat(Enumerable.Repeat("🔐", 30)));
    }

    private static void AssertRoundTrip(string password)
    {
        var hash = PasswordHasher.Hash(password);
        Assert.True(PasswordHasher.Check(password, hash));
        Assert.False(PasswordHasher.Check("something-else-entirely", hash));
    }
}
