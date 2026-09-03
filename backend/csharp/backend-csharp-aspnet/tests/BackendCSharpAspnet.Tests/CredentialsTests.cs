using System.Text.Json;
using Dev.Multistack.App.Security;
using Xunit;

namespace BackendCSharpAspnet.Tests;

public sealed class CredentialsTests
{
    private static readonly string BothRequired =
        CredentialMessages.UsernameRequired + CredentialMessages.Separator + CredentialMessages.PasswordRequired;
    private static readonly string BothWrongLength =
        CredentialMessages.UsernameLength + CredentialMessages.Separator + CredentialMessages.PasswordLength;
    private static readonly string RequiredAndLength =
        CredentialMessages.UsernameRequired + CredentialMessages.Separator + CredentialMessages.PasswordLength;

    [Theory]
    [InlineData("valid", """{"username":"user1","password":"password1"}""", "user1", "password1", "")]
    [InlineData("empty body", "{}", "", "", "both-required")]
    [InlineData("malformed json", "not json", "", "", "both-required")]
    [InlineData("null username", """{"username":null,"password":"password1"}""", "", "", "username is required")]
    [InlineData("numeric username", """{"username":42,"password":"password1"}""", "", "", "username is required")]
    [InlineData("blank username", """{"username":"","password":"password1"}""", "", "", "username is required")]
    [InlineData("missing password", """{"username":"user1"}""", "", "", "password is required")]
    [InlineData("numeric password", """{"username":"user1","password":123456}""", "", "", "password is required")]
    [InlineData("blank password", """{"username":"user1","password":""}""", "", "", "password is required")]
    [InlineData("username too short", """{"username":"ab","password":"password1"}""", "", "", "username must be 3-64 characters")]
    [InlineData("password too short", """{"username":"user1","password":"pass"}""", "", "", "password must be 6-128 characters")]
    [InlineData("both fields blank", """{"username":"","password":""}""", "", "", "both-required")]
    [InlineData("both fields too short", """{"username":"ab","password":"pass"}""", "", "", "both-length")]
    [InlineData("blank username with short password", """{"username":"","password":"pass"}""", "", "", "required-length")]
    public void Validate(string name, string body, string username, string password, string messageKey)
    {
        _ = name;
        var message = messageKey switch
        {
            "" => "",
            "both-required" => BothRequired,
            "both-length" => BothWrongLength,
            "required-length" => RequiredAndLength,
            _ => messageKey,
        };
        Credentials creds;
        try
        {
            creds = JsonSerializer.Deserialize<Credentials>(body) ?? new Credentials();
        }
        catch (JsonException)
        {
            creds = new Credentials();
        }

        var (gotUser, gotPass, gotMessage) = creds.Validate();
        Assert.Equal(message, gotMessage);
        Assert.Equal(username, gotUser);
        Assert.Equal(password, gotPass);
    }

    [Theory]
    [InlineData("shortest allowed", 3, 6, "")]
    [InlineData("longest allowed", 64, 128, "")]
    [InlineData("username one over", 65, 9, "username must be 3-64 characters")]
    [InlineData("password one over", 5, 129, "password must be 6-128 characters")]
    public void ValidateBoundaries(string name, int usernameLen, int passwordLen, string message)
    {
        _ = name;
        var username = usernameLen == 5 ? "user1" : new string('u', usernameLen);
        if (name == "password one over")
        {
            username = "user1";
        }

        var password = name is "username one over" ? "password1" : new string('p', passwordLen);
        var json = JsonSerializer.Serialize(new { username, password });
        var creds = JsonSerializer.Deserialize<Credentials>(json)!;
        var (_, _, got) = creds.Validate();
        Assert.Equal(message, got);
    }

    [Fact]
    public void MultibyteUsernameCountsRunes()
    {
        var json = JsonSerializer.Serialize(new { username = "ФИО", password = "password1" });
        var creds = JsonSerializer.Deserialize<Credentials>(json)!;
        var (username, _, message) = creds.Validate();
        Assert.Equal("", message);
        Assert.Equal("ФИО", username);
    }
}
