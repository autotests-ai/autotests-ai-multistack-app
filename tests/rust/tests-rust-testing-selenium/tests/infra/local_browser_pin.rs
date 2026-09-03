use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;
use tests_rust_testing_selenium::TestConfig;

fn major(version: &str) -> &str {
    version.split('.').next().unwrap_or(version)
}

fn layer() {
    tests::layer_infra("Local browser pin", "Test infra", "Local browser pin", "normal");
}

#[allure_test(name = "pinnedVersion is a full Chrome for Testing build number")]
#[test]
fn pinned_version_is_full_build_number() {
    layer();
    let version = tests::pinned_version().expect("pin");
    let ok = version.split('.').filter(|p| p.chars().all(|c| c.is_ascii_digit())).count() == 4
        && version.split('.').count() == 4;
    assert!(ok, "chrome-for-testing.properties must pin an exact build, got: {version}");
}

#[allure_test(name = "configured browserVersion stays on the pinned major")]
#[test]
fn configured_browser_version_matches_pin() {
    layer();
    let pinned = tests::pinned_version().expect("pin");
    assert_eq!(
        major(&tests::load_config().browser_version),
        major(&pinned),
        "browserVersion and chrome-for-testing.properties drifted apart"
    );
}

#[allure_test(name = "apply rejects a browserVersion from another major")]
#[test]
fn apply_rejects_foreign_major() {
    layer();
    let foreign_major = major(&tests::pinned_version().expect("pin"))
        .parse::<i32>()
        .expect("major")
        + 1;
    let err = tests::apply(&foreign_major.to_string()).expect_err("foreign major");
    assert!(err.contains("pinned build is"), "{err}");
}

#[allure_test(name = "apply refuses to fall back to system Chrome")]
#[test]
fn apply_rejects_blank_browser_version() {
    layer();
    let err = tests::apply(" ").expect_err("blank");
    assert!(err.contains("browserVersion is required"), "{err}");
}

#[allure_test(name = "runtime rejects a non-Chrome browser")]
#[test]
fn require_chrome_rejects_firefox() {
    layer();
    let config = TestConfig {
        browser: "firefox".into(),
        ..Default::default()
    };
    let err = tests::require_chrome(&config).expect_err("firefox");
    assert!(err.contains("Chrome-only"), "{err}");
}
