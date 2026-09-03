using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Dev.Multistack.App.Security;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace BackendCSharpAspnet.Tests;

public sealed class TokenServiceTests
{
    private const string TestSecret = Harness.TestSecret;

    [Fact]
    public void RoundTrip()
    {
        var tokens = new TokenService(TestSecret, TimeSpan.FromHours(1));
        var raw = tokens.Create("user1");
        Assert.Equal("user1", tokens.Username(raw));
    }

    [Fact]
    public void Claims()
    {
        var tokens = new TokenService(TestSecret, TimeSpan.FromHours(1));
        var raw = tokens.Create("user1");
        var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
        var parsed = handler.ReadJwtToken(raw);
        Assert.Equal("HS256", parsed.Header.Alg);
        Assert.NotNull(parsed.IssuedAt);
        Assert.NotNull(parsed.ValidTo);
        Assert.Equal(TimeSpan.FromHours(1), parsed.ValidTo - parsed.IssuedAt);
        Assert.Equal("user1", parsed.Subject);
    }

    [Fact]
    public void Rejections()
    {
        var tokens = new TokenService(TestSecret, TimeSpan.FromHours(1));
        var valid = tokens.Create("user1");
        var expired = new TokenService(TestSecret, TimeSpan.FromMinutes(-1)).Create("user1");
        var foreign = new TokenService("another-secret-that-is-long-enough-for-hs256", TimeSpan.FromHours(1)).Create("user1");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestSecret));
        var hs512Key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(TestSecret + new string('x', 64 - Encoding.UTF8.GetByteCount(TestSecret))));
        var hs512 = new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
            claims: [new Claim(JwtRegisteredClaimNames.Sub, "user1")],
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: new SigningCredentials(hs512Key, SecurityAlgorithms.HmacSha512)));
        var noSubject = new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)));

        var cases = new Dictionary<string, string>
        {
            ["empty"] = "",
            ["garbage"] = "not.a.token",
            ["expired"] = expired,
            ["signed elsewhere"] = foreign,
            ["unexpected alg"] = hs512,
            ["missing subject"] = noSubject,
            ["truncated payload"] = valid[..^4],
            ["tampered signature"] = valid + "x",
        };

        foreach (var (name, raw) in cases)
        {
            var ex = Assert.Throws<InvalidTokenException>(() => tokens.Username(raw));
            Assert.Equal("invalid token", ex.Message);
            _ = name;
        }
    }
}
