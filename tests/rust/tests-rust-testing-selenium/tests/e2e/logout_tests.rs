use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

fn layer() {
    tests::layer_e2e("Logout", "Authentication", "Logout", "critical");
    allure_rust_commons::tag("positive");
}

#[allure_test(name = "User can logout after form login")]
#[tokio::test]
async fn should_logout_after_form_login() {
    layer();
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .fill_and_submit_form("user1", "password1")
            .await
            .should_have_welcome_message("Welcome, user1!")
            .await
            .should_show_session_actions()
            .await;
        tests::HomePage::default()
            .click_logout_button()
            .await
            .should_have_form_title("Login Form")
            .await;
    })
    .await;
}

#[allure_test(name = "User can logout after localStorage authentication")]
#[tokio::test]
async fn should_logout_after_local_storage_authentication() {
    layer();
    tests::with_browser(|| async {
        tests::HomePage::default()
            .open_page_with_local_storage_authentication("user1", "password1")
            .await
            .should_have_welcome_message("Welcome, user1!")
            .await
            .should_show_session_actions()
            .await;
        tests::HomePage::default()
            .click_logout_button()
            .await
            .should_have_form_title("Login Form")
            .await;
    })
    .await;
}
