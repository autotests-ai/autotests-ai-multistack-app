use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

const PASSWORD: &str = "password123";

fn layer() {
    tests::layer_e2e("Delete account", "Authentication", "Delete account", "critical");
    allure_rust_commons::tag("positive");
}

#[allure_test(name = "Confirming delete account clears the session and navigates to login")]
#[tokio::test]
async fn confirming_delete_clears_session_and_navigates_to_login() {
    layer();
    let username = tests::faker_username();
    let _ = tests::register(allure.clone(), &username, PASSWORD).await;
    tests::with_browser({
        let username = username.clone();
        move || async move {
            tests::HomePage::default()
                .open_page_with_local_storage_authentication(&username, PASSWORD)
                .await
                .should_have_welcome_message(&format!("Welcome, {username}!"))
                .await
                .should_show_session_actions()
                .await
                .click_delete_account_and_confirm()
                .await
                .should_have_form_title("Login Form")
                .await;
            tests::HomePage::default().should_clear_auth_token().await;
        }
    })
    .await;
}

#[allure_test(name = "Cancelling the confirm keeps the session and sends no delete request")]
#[tokio::test]
async fn cancelling_confirm_keeps_session() {
    layer();
    let username = tests::faker_username();
    let _ = tests::register(allure.clone(), &username, PASSWORD).await;
    tests::with_browser({
        let username = username.clone();
        move || async move {
            tests::HomePage::default()
                .open_page_with_local_storage_authentication(&username, PASSWORD)
                .await
                .should_have_welcome_message(&format!("Welcome, {username}!"))
                .await
                .click_delete_account_and_cancel()
                .await
                .should_have_welcome_message(&format!("Welcome, {username}!"))
                .await
                .should_keep_auth_token()
                .await;
        }
    })
    .await;
    let _ = tests::login(allure.clone(), &username, PASSWORD).await;
    tests::delete_account_quietly(allure.clone(), &username, PASSWORD).await;
}
