using System.Text.Json;
using System.Text.Json.Serialization;

namespace Dev.Multistack.App.Security;

/// <summary>Credential bounds shared with every other reference backend.</summary>
public static class CredentialBounds
{
    public const int UsernameMinLength = 3;
    public const int UsernameMaxLength = 64;
    public const int PasswordMinLength = 6;
    public const int PasswordMaxLength = 128;
}

/// <summary>Validation messages are part of the contract — do not reword.</summary>
public static class CredentialMessages
{
    public const string UsernameRequired = "username is required";
    public const string PasswordRequired = "password is required";
    public const string UsernameLength = "username must be 3-64 characters";
    public const string PasswordLength = "password must be 6-128 characters";
    public const string Separator = "; ";
}

/// <summary>
/// Raw /api/auth request body. Fields stay <see cref="JsonElement"/> so a missing field
/// and a field of the wrong JSON type both yield the same "is required" message as the
/// Python and JVM backends.
/// </summary>
public sealed class Credentials
{
    [JsonPropertyName("username")]
    public JsonElement Username { get; set; }

    [JsonPropertyName("password")]
    public JsonElement Password { get; set; }

    /// <summary>
    /// Trusted string values, or a non-empty message naming every violating field,
    /// joined with <see cref="CredentialMessages.Separator"/>. Lengths are counted in
    /// runes, matching Python's len() on str.
    /// </summary>
    public (string Username, string Password, string Message) Validate()
    {
        var (username, usernameMessage) = CheckField(
            Username,
            CredentialBounds.UsernameMinLength,
            CredentialBounds.UsernameMaxLength,
            CredentialMessages.UsernameRequired,
            CredentialMessages.UsernameLength);
        var (password, passwordMessage) = CheckField(
            Password,
            CredentialBounds.PasswordMinLength,
            CredentialBounds.PasswordMaxLength,
            CredentialMessages.PasswordRequired,
            CredentialMessages.PasswordLength);

        var violations = new List<string>(2);
        if (usernameMessage.Length > 0)
        {
            violations.Add(usernameMessage);
        }

        if (passwordMessage.Length > 0)
        {
            violations.Add(passwordMessage);
        }

        return violations.Count > 0
            ? ("", "", string.Join(CredentialMessages.Separator, violations))
            : (username, password, "");
    }

    private static (string Value, string Message) CheckField(
        JsonElement raw,
        int minLength,
        int maxLength,
        string required,
        string length)
    {
        if (raw.ValueKind != JsonValueKind.String)
        {
            return ("", required);
        }

        var value = raw.GetString();
        if (string.IsNullOrEmpty(value))
        {
            return ("", required);
        }

        var n = value.EnumerateRunes().Count();
        if (n < minLength || n > maxLength)
        {
            return ("", length);
        }

        return (value, "");
    }
}
