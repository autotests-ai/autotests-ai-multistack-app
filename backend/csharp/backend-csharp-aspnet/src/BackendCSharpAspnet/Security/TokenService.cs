using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Dev.Multistack.App.Security;

public sealed class InvalidTokenException : Exception
{
    public InvalidTokenException()
        : base("invalid token")
    {
    }

    public InvalidTokenException(Exception inner)
        : base("invalid token", inner)
    {
    }
}

/// <summary>Issues and verifies the HS256 tokens described in the module README.</summary>
public sealed class TokenService
{
    private readonly SymmetricSecurityKey _key;
    private readonly TimeSpan _expiration;
    private readonly JwtSecurityTokenHandler _handler;

    public TokenService(string secret, TimeSpan expiration)
    {
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        _expiration = expiration;
        _handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
    }

    public string Create(string username)
    {
        var now = DateTime.UtcNow;
        var expires = now.Add(_expiration);
        var token = new JwtSecurityToken(
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, username),
                new Claim(
                    JwtRegisteredClaimNames.Iat,
                    EpochTime.GetIntDate(now).ToString(),
                    ClaimValueTypes.Integer64),
            ],
            expires: expires,
            signingCredentials: new SigningCredentials(_key, SecurityAlgorithms.HmacSha256));
        return _handler.WriteToken(token);
    }

    public string Username(string raw)
    {
        if (string.IsNullOrEmpty(raw))
        {
            throw new InvalidTokenException();
        }

        try
        {
            var principal = _handler.ValidateToken(raw, ValidationParameters(), out _);
            var subject = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (string.IsNullOrEmpty(subject))
            {
                throw new InvalidTokenException();
            }

            return subject;
        }
        catch (InvalidTokenException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new InvalidTokenException(ex);
        }
    }

    private TokenValidationParameters ValidationParameters() => new()
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = _key,
        ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        RequireExpirationTime = true,
        RequireSignedTokens = true,
        ClockSkew = TimeSpan.Zero,
    };
}
