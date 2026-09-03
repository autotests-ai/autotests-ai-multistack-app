use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

#[allure_test(name = "Register form fields and submit are visible")]
#[tokio::test]
async fn register_form_is_mounted() {
    tests::layer_ui(
        "Register form mount",
        "Authentication",
        "Register form",
        "normal",
    );
    allure_rust_commons::tag("mock");
    tests::with_browser(|| async {
        tests::RegisterPage::default()
            .open_page()
            .await
            .should_show_register_form()
            .await
            .should_have_form_title("Register")
            .await;
    })
    .await;
}
