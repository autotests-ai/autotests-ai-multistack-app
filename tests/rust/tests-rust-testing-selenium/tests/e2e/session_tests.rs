use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

fn layer() {
    tests::layer_e2e("Session", "Authentication", "Session", "critical");
}

#[allure_test(name = "Invalid token clears session and hides welcome")]
#[tokio::test]
async fn invalid_token_clears_session() {
    layer();
    allure_rust_commons::tag("negative");
    tests::with_browser(|| async {
        tests::HomePage::default()
            .open_page_with_invalid_token()
            .await
            .should_hide_welcome_panel()
            .await
            .should_clear_auth_token()
            .await;
    })
    .await;
}

#[allure_test(name = "Session survives a page reload (token in localStorage)")]
#[tokio::test]
async fn session_survives_reload() {
    layer();
    allure_rust_commons::tag("positive");
    tests::with_browser(|| async {
        tests::HomePage::default()
            .open_page_with_local_storage_authentication("user1", "password1")
            .await
            .should_have_welcome_message("Welcome, user1!")
            .await
            .reload_page()
            .await
            .should_have_welcome_message("Welcome, user1!")
            .await;
    })
    .await;
}
