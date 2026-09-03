use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Once;
use std::time::Duration;

/// Java TestConfig analog (HTTP-only: baseUrl + apiBaseUrl).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestConfig {
    pub stand: String,
    pub base_url: String,
    pub api_base_url: String,
    pub api_health_service: String,
}

/// Closed helper (Java ConfigReader analog).
#[derive(Debug, Clone, Copy)]
pub struct ConfigReader {
    _private: (),
}

impl ConfigReader {
    fn new() -> Self {
        Self { _private: () }
    }
}

/// Java private constructor analog — ConfigReader tests reach the closed helper.
pub fn closed_config_reader() -> ConfigReader {
    ConfigReader::new()
}

pub const HTTP_TIMEOUT: Duration = Duration::from_secs(10);

fn stands() -> HashMap<&'static str, TestConfig> {
    HashMap::from([
        (
            "prod",
            TestConfig {
                stand: "prod".into(),
                base_url: "https://autotests.ai/stack/backend-java-spring/frontend-typescript-react"
                    .into(),
                api_base_url: "https://autotests.ai/stack/backend-java-spring/".into(),
                api_health_service: "backend-java-spring".into(),
            },
        ),
        (
            "stage",
            TestConfig {
                stand: "stage".into(),
                base_url:
                    "https://stage.autotests.ai/stack/backend-java-spring/frontend-typescript-react"
                        .into(),
                api_base_url: "https://stage.autotests.ai/stack/backend-java-spring/".into(),
                api_health_service: "backend-java-spring".into(),
            },
        ),
        (
            "mock",
            TestConfig {
                stand: "mock".into(),
                base_url: "http://localhost:9911".into(),
                api_base_url: "http://localhost:9911/".into(),
                api_health_service: "backend-java-spring".into(),
            },
        ),
        (
            "ci",
            TestConfig {
                stand: "ci".into(),
                base_url: "http://localhost:9821".into(),
                api_base_url: "http://localhost:8800/".into(),
                api_health_service: "backend-java-spring".into(),
            },
        ),
    ])
}

fn first_non_empty(values: &[&str]) -> String {
    for value in values {
        if !value.trim().is_empty() {
            return (*value).to_string();
        }
    }
    String::new()
}

fn env_or_empty(key: &str) -> String {
    std::env::var(key).unwrap_or_default()
}

fn with_slash(s: &str) -> String {
    if s.ends_with('/') {
        s.to_string()
    } else {
        format!("{s}/")
    }
}

fn resolve_stand() -> String {
    let raw = first_non_empty(&[&env_or_empty("STAND"), &env_or_empty("ENV"), "prod"])
        .to_ascii_lowercase();
    let trimmed = raw.trim().to_string();
    if stands().contains_key(trimmed.as_str()) {
        trimmed
    } else {
        "prod".into()
    }
}

/// Reads STAND / BASE_URL / API_BASE_URL without slash-normalizing stored fields.
pub fn load_config() -> TestConfig {
    let stand = resolve_stand();
    let defaults = stands()
        .get(stand.as_str())
        .cloned()
        .expect("known stand");
    let base = first_non_empty(&[&env_or_empty("BASE_URL"), &defaults.base_url]);
    let api = first_non_empty(&[&env_or_empty("API_BASE_URL"), &defaults.api_base_url]);
    TestConfig {
        stand,
        base_url: base,
        api_base_url: api,
        api_health_service: first_non_empty(&[
            &env_or_empty("API_HEALTH_SERVICE"),
            "backend-java-spring",
        ]),
    }
}

/// Adds a trailing slash to HTTP baseUrl (Java ConfigReader.resolveBaseUrl).
pub fn resolve_base_url(cfg: &TestConfig) -> Result<String, String> {
    let url = cfg.base_url.trim();
    if url.is_empty() {
        return Err("Set baseUrl in config/${env}.properties".into());
    }
    Ok(with_slash(url))
}

/// Adds a trailing slash to HTTP apiBaseUrl (Java ConfigReader.resolveApiBaseUrl).
pub fn resolve_api_base_url(cfg: &TestConfig) -> Result<String, String> {
    let url = cfg.api_base_url.trim();
    if url.is_empty() {
        return Err("Set apiBaseUrl in config/${env}.properties".into());
    }
    Ok(with_slash(url))
}

pub fn must_api_base_url() -> String {
    resolve_api_base_url(&load_config()).expect("apiBaseUrl")
}

pub fn ensure_allure_results_dir() {
    static ONCE: Once = Once::new();
    ONCE.call_once(|| {
        if std::env::var_os("ALLURE_RESULTS_DIR").is_some() {
            return;
        }
        let dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("allure-results");
        std::env::set_var("ALLURE_RESULTS_DIR", dir);
    });
}
