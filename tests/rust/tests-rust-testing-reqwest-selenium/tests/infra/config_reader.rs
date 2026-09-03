use allure_cargotest::allure_test;
use tests_rust_testing_reqwest_selenium as tests;
use tests_rust_testing_reqwest_selenium::TestConfig;

#[allure_test(name = "resolveBaseUrl adds trailing slash to HTTP baseUrl")]
#[test]
fn resolve_base_url_adds_trailing_slash() {
    tests::layer_infra("ConfigReader", "Test infra", "ConfigReader", "normal");
    let url = tests::resolve_base_url(&TestConfig {
        stand: "ci".into(),
        base_url: "http://localhost:3000".into(),
        api_base_url: String::new(),
        api_health_service: "backend-java-spring".into(),
        ..Default::default()
    })
    .expect("baseUrl");
    assert_eq!(url, "http://localhost:3000/");
}

#[allure_test(name = "resolveBaseUrl keeps trailing slash on baseUrl")]
#[test]
fn resolve_base_url_keeps_trailing_slash() {
    tests::layer_infra("ConfigReader", "Test infra", "ConfigReader", "normal");
    let url = tests::resolve_base_url(&TestConfig {
        stand: "ci".into(),
        base_url: "http://localhost:3000/".into(),
        api_base_url: String::new(),
        api_health_service: "backend-java-spring".into(),
        ..Default::default()
    })
    .expect("baseUrl");
    assert_eq!(url, "http://localhost:3000/");
}

#[allure_test(name = "resolveBaseUrl fails fast when baseUrl is empty")]
#[test]
fn resolve_base_url_fails_when_empty() {
    tests::layer_infra("ConfigReader", "Test infra", "ConfigReader", "normal");
    let err = tests::resolve_base_url(&TestConfig {
        stand: "ci".into(),
        base_url: String::new(),
        api_base_url: String::new(),
        api_health_service: "backend-java-spring".into(),
        ..Default::default()
    })
    .expect_err("empty");
    assert!(err.contains("Set baseUrl"), "{err}");
}

#[allure_test(name = "resolveApiBaseUrl adds trailing slash to HTTP apiBaseUrl")]
#[test]
fn resolve_api_base_url_adds_trailing_slash() {
    tests::layer_infra("ConfigReader", "Test infra", "ConfigReader", "normal");
    let url = tests::resolve_api_base_url(&TestConfig {
        stand: "ci".into(),
        base_url: String::new(),
        api_base_url: "http://api.example.com".into(),
        api_health_service: "backend-java-spring".into(),
        ..Default::default()
    })
    .expect("apiBaseUrl");
    assert_eq!(url, "http://api.example.com/");
}

#[allure_test(name = "resolveApiBaseUrl fails fast when apiBaseUrl is empty")]
#[test]
fn resolve_api_base_url_fails_when_empty() {
    tests::layer_infra("ConfigReader", "Test infra", "ConfigReader", "normal");
    let err = tests::resolve_api_base_url(&TestConfig {
        stand: "ci".into(),
        base_url: String::new(),
        api_base_url: String::new(),
        api_health_service: "backend-java-spring".into(),
        ..Default::default()
    })
    .expect_err("empty");
    assert!(err.contains("Set apiBaseUrl"), "{err}");
}

#[allure_test(name = "loaded baseUrl has no trailing slash (Owner file; Ui.open uses resolveBaseUrl)")]
#[test]
fn loaded_base_url_has_no_trailing_slash() {
    tests::layer_infra("ConfigReader", "Test infra", "ConfigReader", "normal");
    std::env::set_var("STAND", "ci");
    std::env::set_var("ENV", "ci");
    std::env::set_var("BASE_URL", "");
    std::env::set_var("API_BASE_URL", "");
    let cfg = tests::load_config();
    assert_eq!(cfg.base_url, "http://localhost:9821");
    assert!(!cfg.base_url.ends_with('/'));
}

#[allure_test(name = "resolveBaseUrl uses loaded config")]
#[test]
fn resolve_base_url_uses_loaded_config() {
    tests::layer_infra("ConfigReader", "Test infra", "ConfigReader", "normal");
    std::env::set_var("STAND", "ci");
    std::env::set_var("ENV", "ci");
    std::env::set_var("BASE_URL", "");
    std::env::set_var("API_BASE_URL", "");
    let url = tests::resolve_base_url(&tests::load_config()).expect("baseUrl");
    assert_eq!(url, "http://localhost:9821/");
}

#[allure_test(name = "resolveApiBaseUrl uses loaded config")]
#[test]
fn resolve_api_base_url_uses_loaded_config() {
    tests::layer_infra("ConfigReader", "Test infra", "ConfigReader", "normal");
    std::env::set_var("STAND", "ci");
    std::env::set_var("ENV", "ci");
    std::env::set_var("BASE_URL", "");
    std::env::set_var("API_BASE_URL", "");
    let url = tests::resolve_api_base_url(&tests::load_config()).expect("apiBaseUrl");
    assert_eq!(url, "http://localhost:8800/");
}

#[allure_test(name = "private constructor keeps utility class closed")]
#[test]
fn private_constructor_keeps_utility_class_closed() {
    tests::layer_infra("ConfigReader", "Test infra", "ConfigReader", "normal");
    let _closed = tests::closed_config_reader();
}
