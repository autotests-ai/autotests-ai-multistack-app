use allure_cargotest::allure_test;
use tests_rust_testing_reqwest_selenium as tests;

fn layer() {
    tests::layer_infra("ScreenshotHelper", "Test infra", "ScreenshotHelper", "normal");
}

#[allure_test(name = "screenshotMode maps env to a stand folder")]
#[test]
fn screenshot_mode_maps_env_to_stand_folder() {
    layer();
    for (env, folder) in [
        ("mock", "mock"),
        ("stage", "stage"),
        ("prod", "prod"),
        ("ci", "prod"),
        ("", "prod"),
    ] {
        assert_eq!(tests::screenshot_mode_for(env).expect(env), folder, "{env}");
    }
}

#[allure_test(name = "screenshotMode rejects unknown env")]
#[test]
fn screenshot_mode_rejects_unknown_env() {
    layer();
    for env in ["dev", "local", "multistack_ci"] {
        let err = tests::screenshot_mode_for(env).expect_err(env);
        assert!(err.contains("unknown env"), "{err}");
    }
}
