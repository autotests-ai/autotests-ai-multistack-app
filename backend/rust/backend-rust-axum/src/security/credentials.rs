use serde_json::Value;

pub const USERNAME_MIN_LENGTH: usize = 3;
pub const USERNAME_MAX_LENGTH: usize = 64;
pub const PASSWORD_MIN_LENGTH: usize = 6;
pub const PASSWORD_MAX_LENGTH: usize = 128;

pub const MESSAGE_USERNAME_REQUIRED: &str = "username is required";
pub const MESSAGE_PASSWORD_REQUIRED: &str = "password is required";
pub const MESSAGE_USERNAME_LENGTH: &str = "username must be 3-64 characters";
pub const MESSAGE_PASSWORD_LENGTH: &str = "password must be 6-128 characters";
pub const MESSAGE_SEPARATOR: &str = "; ";

#[derive(Debug, Clone, Default, serde::Deserialize)]
pub struct Credentials {
    pub username: Option<Value>,
    pub password: Option<Value>,
}

impl Credentials {
    pub fn validate(&self) -> Result<(String, String), String> {
        let (username, username_message) = check_field(
            self.username.as_ref(),
            USERNAME_MIN_LENGTH,
            USERNAME_MAX_LENGTH,
            MESSAGE_USERNAME_REQUIRED,
            MESSAGE_USERNAME_LENGTH,
        );
        let (password, password_message) = check_field(
            self.password.as_ref(),
            PASSWORD_MIN_LENGTH,
            PASSWORD_MAX_LENGTH,
            MESSAGE_PASSWORD_REQUIRED,
            MESSAGE_PASSWORD_LENGTH,
        );

        let mut violations = Vec::new();
        if let Some(msg) = username_message {
            violations.push(msg);
        }
        if let Some(msg) = password_message {
            violations.push(msg);
        }
        if !violations.is_empty() {
            return Err(violations.join(MESSAGE_SEPARATOR));
        }
        Ok((username.unwrap(), password.unwrap()))
    }
}

fn check_field(
    raw: Option<&Value>,
    min_length: usize,
    max_length: usize,
    required: &str,
    length: &str,
) -> (Option<String>, Option<String>) {
    let Some(value) = raw else {
        return (None, Some(required.to_string()));
    };
    let Some(text) = value.as_str() else {
        return (None, Some(required.to_string()));
    };
    if text.is_empty() {
        return (None, Some(required.to_string()));
    }
    let chars = text.chars().count();
    if chars < min_length || chars > max_length {
        return (None, Some(length.to_string()));
    }
    (Some(text.to_string()), None)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse(body: &str) -> Credentials {
        serde_json::from_str(body).unwrap_or_default()
    }

    #[test]
    fn validate_matrix() {
        let both_required = format!(
            "{MESSAGE_USERNAME_REQUIRED}{MESSAGE_SEPARATOR}{MESSAGE_PASSWORD_REQUIRED}"
        );
        let both_wrong_length = format!(
            "{MESSAGE_USERNAME_LENGTH}{MESSAGE_SEPARATOR}{MESSAGE_PASSWORD_LENGTH}"
        );
        let required_and_length = format!(
            "{MESSAGE_USERNAME_REQUIRED}{MESSAGE_SEPARATOR}{MESSAGE_PASSWORD_LENGTH}"
        );
        let cases: &[(&str, &str, Result<(&str, &str), &str>)] = &[
            (
                "valid",
                r#"{"username":"user1","password":"password1"}"#,
                Ok(("user1", "password1")),
            ),
            ("empty body", "{}", Err(&both_required)),
            ("malformed json", "not json", Err(&both_required)),
            (
                "null username",
                r#"{"username":null,"password":"password1"}"#,
                Err(MESSAGE_USERNAME_REQUIRED),
            ),
            (
                "numeric username",
                r#"{"username":42,"password":"password1"}"#,
                Err(MESSAGE_USERNAME_REQUIRED),
            ),
            (
                "blank username",
                r#"{"username":"","password":"password1"}"#,
                Err(MESSAGE_USERNAME_REQUIRED),
            ),
            (
                "missing password",
                r#"{"username":"user1"}"#,
                Err(MESSAGE_PASSWORD_REQUIRED),
            ),
            (
                "numeric password",
                r#"{"username":"user1","password":123456}"#,
                Err(MESSAGE_PASSWORD_REQUIRED),
            ),
            (
                "blank password",
                r#"{"username":"user1","password":""}"#,
                Err(MESSAGE_PASSWORD_REQUIRED),
            ),
            (
                "username too short",
                r#"{"username":"ab","password":"password1"}"#,
                Err(MESSAGE_USERNAME_LENGTH),
            ),
            (
                "password too short",
                r#"{"username":"user1","password":"pass"}"#,
                Err(MESSAGE_PASSWORD_LENGTH),
            ),
            (
                "both fields blank",
                r#"{"username":"","password":""}"#,
                Err(&both_required),
            ),
            (
                "both fields too short",
                r#"{"username":"ab","password":"pass"}"#,
                Err(&both_wrong_length),
            ),
            (
                "blank username with short password",
                r#"{"username":"","password":"pass"}"#,
                Err(&required_and_length),
            ),
        ];
        for (name, body, want) in cases {
            let result = parse(body).validate();
            match want {
                Ok((username, password)) => {
                    assert_eq!(result.as_ref().unwrap(), &((*username).to_string(), (*password).to_string()), "{name}");
                }
                Err(message) => {
                    assert_eq!(result.unwrap_err(), **message, "{name}");
                }
            }
        }
    }

    #[test]
    fn validate_boundaries() {
        let shortest = Credentials {
            username: Some(Value::String("u".repeat(3))),
            password: Some(Value::String("p".repeat(6))),
        };
        assert!(shortest.validate().is_ok());

        let longest = Credentials {
            username: Some(Value::String("u".repeat(64))),
            password: Some(Value::String("p".repeat(128))),
        };
        assert!(longest.validate().is_ok());

        let username_over = Credentials {
            username: Some(Value::String("u".repeat(65))),
            password: Some(Value::String("password1".into())),
        };
        assert_eq!(username_over.validate().unwrap_err(), MESSAGE_USERNAME_LENGTH);

        let password_over = Credentials {
            username: Some(Value::String("user1".into())),
            password: Some(Value::String("p".repeat(129))),
        };
        assert_eq!(password_over.validate().unwrap_err(), MESSAGE_PASSWORD_LENGTH);

        let multibyte = Credentials {
            username: Some(Value::String("ФИО".into())),
            password: Some(Value::String("password1".into())),
        };
        assert!(multibyte.validate().is_ok());
    }
}
