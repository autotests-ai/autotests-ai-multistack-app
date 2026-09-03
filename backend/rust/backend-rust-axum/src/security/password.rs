use bcrypt::{hash, verify, DEFAULT_COST};

const BCRYPT_MAX_INPUT_BYTES: usize = 72;

pub fn hash_password(password: &str) -> Result<String, bcrypt::BcryptError> {
    hash(bcrypt_input(password), DEFAULT_COST)
}

pub fn check_password(password: &str, stored: &str) -> bool {
    verify(bcrypt_input(password), stored).unwrap_or(false)
}

fn bcrypt_input(password: &str) -> &[u8] {
    let input = password.as_bytes();
    if input.len() > BCRYPT_MAX_INPUT_BYTES {
        &input[..BCRYPT_MAX_INPUT_BYTES]
    } else {
        input
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip() {
        let stored = hash_password("password1").unwrap();
        assert!(stored.starts_with("$2"));
        assert!(check_password("password1", &stored));
        assert!(!check_password("password2", &stored));
    }

    #[test]
    fn hash_is_salted() {
        let first = hash_password("password1").unwrap();
        let second = hash_password("password1").unwrap();
        assert_ne!(first, second);
    }

    #[test]
    fn rejects_garbage_hash() {
        assert!(!check_password("password1", "not-a-bcrypt-hash"));
    }

    #[test]
    fn beyond_bcrypt_input_limit() {
        let long = "p".repeat(100);
        let stored = hash_password(&long).unwrap();
        assert!(check_password(&long, &stored));
        assert!(!check_password(&"q".repeat(100), &stored));
    }

    #[test]
    fn ignores_bytes_past_the_limit() {
        let prefix = "p".repeat(72);
        let stored = hash_password(&format!("{prefix}-original-tail")).unwrap();
        assert!(check_password(
            &format!("{prefix}-a-completely-different-tail"),
            &stored
        ));
        assert!(check_password(&prefix, &stored));
        assert!(!check_password(
            &format!("{}-original-tail", "q".repeat(72)),
            &stored
        ));
    }

    #[test]
    fn multibyte_runes_round_trip() {
        let cases = [
            "é".repeat(36),
            format!("{}{}", "a".repeat(71), "é".repeat(5)),
            "пароль".repeat(20),
            "🔐".repeat(30),
        ];
        for password in cases {
            let stored = hash_password(&password).unwrap();
            assert!(check_password(&password, &stored));
            assert!(!check_password("something-else-entirely", &stored));
        }
    }
}
