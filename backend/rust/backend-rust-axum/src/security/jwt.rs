use std::time::{Duration, SystemTime, UNIX_EPOCH};

use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, thiserror::Error)]
#[error("invalid token")]
pub struct InvalidToken;

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    iat: i64,
    exp: i64,
}

pub struct TokenService {
    secret: String,
    expiration_secs: i64,
}

impl TokenService {
    pub fn new(secret: String, expiration: Duration) -> Self {
        Self::with_expiration_secs(secret, expiration.as_secs() as i64)
    }

    pub fn with_expiration_secs(secret: String, expiration_secs: i64) -> Self {
        Self {
            secret,
            expiration_secs,
        }
    }

    pub fn create(&self, username: &str) -> Result<String, jsonwebtoken::errors::Error> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        let claims = Claims {
            sub: username.to_string(),
            iat: now,
            exp: now + self.expiration_secs,
        };
        encode(
            &Header::new(Algorithm::HS256),
            &claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        )
    }

    pub fn username(&self, raw: &str) -> Result<String, InvalidToken> {
        let mut validation = Validation::new(Algorithm::HS256);
        validation.validate_exp = true;
        validation.leeway = 0;
        let token = decode::<Claims>(
            raw,
            &DecodingKey::from_secret(self.secret.as_bytes()),
            &validation,
        )
        .map_err(|_| InvalidToken)?;
        if token.claims.sub.is_empty() {
            return Err(InvalidToken);
        }
        Ok(token.claims.sub)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const SECRET: &str = "multistack-dev-secret-change-in-production-min-32-chars";

    #[test]
    fn round_trip() {
        let tokens = TokenService::new(SECRET.to_string(), Duration::from_secs(3600));
        let raw = tokens.create("user1").unwrap();
        assert_eq!(tokens.username(&raw).unwrap(), "user1");
    }

    #[test]
    fn claims_are_hs256_with_one_hour_lifetime() {
        let tokens = TokenService::new(SECRET.to_string(), Duration::from_secs(3600));
        let raw = tokens.create("user1").unwrap();
        let mut validation = Validation::new(Algorithm::HS256);
        validation.leeway = 0;
        let token = decode::<Claims>(
            &raw,
            &DecodingKey::from_secret(SECRET.as_bytes()),
            &validation,
        )
        .unwrap();
        assert_eq!(token.header.alg, Algorithm::HS256);
        assert_eq!(token.claims.exp - token.claims.iat, 3600);
    }

    #[test]
    fn rejections() {
        let tokens = TokenService::new(SECRET.to_string(), Duration::from_secs(3600));
        let valid = tokens.create("user1").unwrap();
        let expired = TokenService::with_expiration_secs(SECRET.to_string(), -60)
            .create("user1")
            .unwrap();
        let foreign = TokenService::new(
            "another-secret-that-is-long-enough-for-hs256".into(),
            Duration::from_secs(3600),
        )
        .create("user1")
        .unwrap();

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        let hs512 = encode(
            &Header::new(Algorithm::HS512),
            &Claims {
                sub: "user1".into(),
                iat: now,
                exp: now + 3600,
            },
            &EncodingKey::from_secret(SECRET.as_bytes()),
        )
        .unwrap();
        let no_subject = encode(
            &Header::new(Algorithm::HS256),
            &serde_json::json!({ "exp": now + 3600, "iat": now }),
            &EncodingKey::from_secret(SECRET.as_bytes()),
        )
        .unwrap();

        let cases = [
            ("empty", ""),
            ("garbage", "not.a.token"),
            ("expired", expired.as_str()),
            ("signed elsewhere", foreign.as_str()),
            ("unexpected alg", hs512.as_str()),
            ("missing subject", no_subject.as_str()),
            ("truncated payload", &valid[..valid.len() - 4]),
            ("tampered signature", &format!("{valid}x")),
        ];
        for (name, raw) in cases {
            assert!(
                tokens.username(raw).is_err(),
                "{name}: Username({raw:?}) succeeded"
            );
        }
    }
}
