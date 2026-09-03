using System.Text;

namespace Dev.Multistack.App.Security;

/// <summary>
/// bcrypt at cost 10, matching Spring's BCryptPasswordEncoder and Go's bcrypt.DefaultCost.
/// Input longer than 72 UTF-8 bytes is cut (dropping a trailing incomplete sequence) so
/// the contract's 128-character passwords still round-trip, as in Python bcrypt / bcryptjs.
/// </summary>
public static class PasswordHasher
{
    public const int BcryptMaxInputBytes = 72;
    public const int WorkFactor = 10;

    public static string Hash(string password) =>
        BCrypt.Net.BCrypt.HashPassword(ToBcryptText(password), WorkFactor);

    public static bool Check(string password, string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(ToBcryptText(password), hash);
        }
        catch (Exception)
        {
            return false;
        }
    }

    internal static string ToBcryptText(string password) =>
        Encoding.UTF8.GetString(BcryptInput(password));

    internal static byte[] BcryptInput(string password)
    {
        var input = Encoding.UTF8.GetBytes(password);
        if (input.Length <= BcryptMaxInputBytes)
        {
            return input;
        }

        var length = BcryptMaxInputBytes;
        while (length > 0 && (input[length - 1] & 0xC0) == 0x80)
        {
            length--;
        }

        if (length > 0 && (input[length - 1] & 0x80) != 0)
        {
            length--;
        }

        return input[..length];
    }
}
