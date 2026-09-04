use allure_cargotest::allure_test;
use tests_rust_testing_reqwest_selenium as tests;

const LOGIN_REQUIRED_MESSAGE: &str = "Login is required (minimum 3 characters)";
const LOGIN_MIN_LENGTH_MESSAGE: &str = "Login must be at least 3 characters";
const PASSWORD_REQUIRED_MESSAGE: &str = "Password is required (minimum 6 characters)";
const PASSWORD_MIN_LENGTH_MESSAGE: &str = "Password must be at least 6 characters";
const BOTH_REQUIRED_MESSAGE: &str =
    "Login and password are required (minimum 3 and 6 characters)";
const WRONG_CREDENTIALS_MESSAGE: &str = "Wrong login or password";

fn layer() {
    tests::layer_e2e("Login", "Authentication", "Login", "critical");
}

#[allure_test(name = "User is logged in with valid credentials")]
#[tokio::test]
async fn should_login_with_valid_credentials() {
    layer();
    allure_rust_commons::tag("smoke");
    allure_rust_commons::tag("positive");
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .fill_and_submit_form("user1", "password1")
            .await
            .should_have_welcome_message("Welcome, user1!")
            .await;
    })
    .await;
}

#[allure_test(name = "User is logged in with 3-character login and 6-character password")]
#[tokio::test]
async fn should_login_with_minimum_length_credentials() {
    layer();
    allure_rust_commons::tag("positive");
    let user = tests::User {
        username: tests::username_at_min_length(),
        password: tests::password_at_min_length(),
    };
    tests::register(allure.clone(), &user.username, &user.password).await;
    tests::with_browser({
        let username = user.username.clone();
        let password = user.password.clone();
        let welcome = user.welcome_message();
        move || async move {
            tests::LoginPage::default()
                .open_page()
                .await
                .fill_and_submit_form(&username, &password)
                .await
                .should_have_welcome_message(&welcome)
                .await;
        }
    })
    .await;
    tests::delete_account_quietly(allure.clone(), &user.username, &user.password).await;
}

#[allure_test(name = "Empty username shows validation error")]
#[tokio::test]
async fn should_show_validation_error_when_username_is_empty() {
    layer();
    allure_rust_commons::tag("negative");
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .type_password("password1")
            .await
            .submit_expecting_error()
            .await
            .should_have_error_message(LOGIN_REQUIRED_MESSAGE)
            .await;
    })
    .await;
}

#[allure_test(name = "Empty password shows validation error")]
#[tokio::test]
async fn should_show_validation_error_when_password_is_empty() {
    layer();
    allure_rust_commons::tag("negative");
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .type_username("user1")
            .await
            .submit_expecting_error()
            .await
            .should_have_error_message(PASSWORD_REQUIRED_MESSAGE)
            .await;
    })
    .await;
}

#[allure_test(name = "Wrong password shows readable error")]
#[tokio::test]
async fn should_show_error_when_password_is_wrong() {
    layer();
    allure_rust_commons::tag("negative");
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .type_username("user1")
            .await
            .type_password("wrongpassword")
            .await
            .submit_expecting_error()
            .await
            .should_have_error_message(WRONG_CREDENTIALS_MESSAGE)
            .await;
    })
    .await;
}

#[allure_test(name = "Short username shows validation error")]
#[tokio::test]
async fn should_show_validation_error_when_username_is_too_short() {
    layer();
    allure_rust_commons::tag("negative");
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .type_username("ab")
            .await
            .type_password("password1")
            .await
            .submit_expecting_error()
            .await
            .should_have_error_message(LOGIN_MIN_LENGTH_MESSAGE)
            .await;
    })
    .await;
}

#[allure_test(name = "Short password shows validation error")]
#[tokio::test]
async fn should_show_validation_error_when_password_is_too_short() {
    layer();
    allure_rust_commons::tag("negative");
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .type_username("user1")
            .await
            .type_password("123")
            .await
            .submit_expecting_error()
            .await
            .should_have_error_message(PASSWORD_MIN_LENGTH_MESSAGE)
            .await;
    })
    .await;
}

#[allure_test(name = "Unknown username shows readable error")]
#[tokio::test]
async fn should_show_error_when_username_is_unknown() {
    layer();
    allure_rust_commons::tag("negative");
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .type_username("nouser")
            .await
            .type_password("password1")
            .await
            .submit_expecting_error()
            .await
            .should_have_error_message(WRONG_CREDENTIALS_MESSAGE)
            .await;
    })
    .await;
}

#[allure_test(name = "Empty username and password show validation error")]
#[tokio::test]
async fn should_show_validation_error_when_credentials_are_empty() {
    layer();
    allure_rust_commons::tag("negative");
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .submit_expecting_error()
            .await
            .should_have_error_message(BOTH_REQUIRED_MESSAGE)
            .await;
    })
    .await;
}
