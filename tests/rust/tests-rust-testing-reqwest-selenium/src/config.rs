use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Once;
use std::time::Duration;

/// Java/C# TestConfig analog (HTTP + Chrome-only Selenium cell).
#[derive(Debug, Clone, PartialEq)]
pub struct TestConfig {
    pub stand: String,
    pub base_url: String,
    pub api_base_url: String,
    pub api_health_service: String,
    pub welcome_username: String,
    pub browser: String,
    pub browser_version: String,
    pub browser_size: String,
    pub headless: bool,
    pub close_browser_after_each: bool,
    pub close_browser_after_all: bool,
    pub skip_blank_open: bool,
    pub remote_url: String,
    pub enable_vnc: bool,
    pub enable_video: bool,
    pub update_screenshots: bool,
    pub screenshots_dir: String,
    pub screenshot_diff_threshold: f64,
}

impl Default for TestConfig {
    fn default() -> Self {
        Self {
            stand: "prod".into(),
            base_url: String::new(),
            api_base_url: String::new(),
            api_health_service: "backend-java-spring".into(),
            welcome_username: "user1".into(),
            browser: "chrome".into(),
            browser_version: "148".into(),
            browser_size: "1920x1280".into(),
            headless: false,
            close_browser_after_each: true,
            close_browser_after_all: true,
            skip_blank_open: false,
            remote_url: String::new(),
            enable_vnc: false,
            enable_video: false,
            update_screenshots: false,
            screenshots_dir: "screenshots".into(),
            screenshot_diff_threshold: 0.015,
        }
    }
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
                ..Default::default()
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
                ..Default::default()
            },
        ),
        (
            "mock",
            TestConfig {
                stand: "mock".into(),
                base_url: "http://localhost:9911".into(),
                api_base_url: "http://localhost:9911/".into(),
                api_health_service: "backend-java-spring".into(),
                welcome_username: "mock-user".into(),
                ..Default::default()
            },
        ),
        (
            "ci",
            TestConfig {
                stand: "ci".into(),
                base_url: "http://localhost:9821".into(),
                api_base_url: "http://localhost:8800/".into(),
                api_health_service: "backend-java-spring".into(),
                ..Default::default()
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

fn parse_bool(raw: &str, default_value: bool) -> bool {
    if raw.trim().is_empty() {
        return default_value;
    }
    let key = raw.trim().to_ascii_lowercase();
    key == "true" || key == "1" || key == "yes" || key == "on"
}

fn parse_double(raw: &str, fallback: f64) -> f64 {
    raw.trim()
        .parse::<f64>()
        .unwrap_or(fallback)
}

fn load_properties(stand: &str) -> HashMap<String, String> {
    let path = module_dir().join("config").join(format!("{stand}.properties"));
    let mut result = HashMap::new();
    let Ok(text) = std::fs::read_to_string(path) else {
        return result;
    };
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        let Some(eq) = trimmed.find('=') else {
            continue;
        };
        if eq == 0 {
            continue;
        }
        result.insert(trimmed[..eq].trim().to_string(), trimmed[eq + 1..].trim().to_string());
    }
    result
}

fn prop<'a>(values: &'a HashMap<String, String>, key: &str) -> &'a str {
    values.get(key).map(String::as_str).unwrap_or("")
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

/// Crate root (Cargo.toml / chrome-for-testing.properties / screenshots/).
pub fn module_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

/// Reads STAND / BASE_URL / API_BASE_URL without slash-normalizing stored fields.
pub fn load_config() -> TestConfig {
    let stand = resolve_stand();
    let defaults = stands()
        .get(stand.as_str())
        .cloned()
        .expect("known stand");
    let mut values = load_properties("default");
    for (key, value) in load_properties(&stand) {
        values.insert(key, value);
    }
    let welcome_default = if stand == "mock" { "mock-user" } else { "user1" };
    TestConfig {
        stand: stand.clone(),
        base_url: first_non_empty(&[
            &env_or_empty("BASE_URL"),
            prop(&values, "baseUrl"),
            &defaults.base_url,
        ]),
        api_base_url: first_non_empty(&[
            &env_or_empty("API_BASE_URL"),
            prop(&values, "apiBaseUrl"),
            &defaults.api_base_url,
        ]),
        api_health_service: first_non_empty(&[
            &env_or_empty("API_HEALTH_SERVICE"),
            prop(&values, "apiHealthService"),
            "backend-java-spring",
        ]),
        welcome_username: first_non_empty(&[
            &env_or_empty("WELCOME_USERNAME"),
            prop(&values, "welcomeUsername"),
            welcome_default,
        ]),
        browser: first_non_empty(&[
            &env_or_empty("BROWSER"),
            prop(&values, "browser"),
            "chrome",
        ]),
        browser_version: first_non_empty(&[
            &env_or_empty("BROWSER_VERSION"),
            prop(&values, "browserVersion"),
            "148",
        ]),
        browser_size: first_non_empty(&[
            &env_or_empty("BROWSER_SIZE"),
            prop(&values, "browserSize"),
            "1920x1280",
        ]),
        headless: parse_bool(
            &first_non_empty(&[&env_or_empty("HEADLESS"), prop(&values, "headless")]),
            false,
        ),
        close_browser_after_each: parse_bool(
            &first_non_empty(&[
                &env_or_empty("CLOSE_BROWSER_AFTER_EACH"),
                prop(&values, "closeBrowserAfterEach"),
                "true",
            ]),
            true,
        ),
        close_browser_after_all: parse_bool(
            &first_non_empty(&[
                &env_or_empty("CLOSE_BROWSER_AFTER_ALL"),
                prop(&values, "closeBrowserAfterAll"),
                "true",
            ]),
            true,
        ),
        skip_blank_open: parse_bool(
            &first_non_empty(&[&env_or_empty("SKIP_BLANK_OPEN"), prop(&values, "skipBlankOpen")]),
            false,
        ),
        remote_url: first_non_empty(&[
            &env_or_empty("REMOTE_URL"),
            &env_or_empty("SELENOID_WEBDRIVER_URL"),
            prop(&values, "remoteUrl"),
        ]),
        enable_vnc: parse_bool(
            &first_non_empty(&[&env_or_empty("ENABLE_VNC"), prop(&values, "enableVnc")]),
            false,
        ),
        enable_video: parse_bool(
            &first_non_empty(&[&env_or_empty("ENABLE_VIDEO"), prop(&values, "enableVideo")]),
            false,
        ),
        update_screenshots: parse_bool(
            &first_non_empty(&[
                &env_or_empty("UPDATE_SCREENSHOTS"),
                prop(&values, "updateScreenshots"),
            ]),
            false,
        ),
        screenshots_dir: first_non_empty(&[
            &env_or_empty("SCREENSHOTS_DIR"),
            prop(&values, "screenshotsDir"),
            "screenshots",
        ]),
        screenshot_diff_threshold: parse_double(
            &first_non_empty(&[
                &env_or_empty("SCREENSHOT_DIFF_THRESHOLD"),
                prop(&values, "screenshotDiffThreshold"),
            ]),
            0.015,
        ),
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

pub fn must_base_url() -> String {
    resolve_base_url(&load_config()).expect("baseUrl")
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
