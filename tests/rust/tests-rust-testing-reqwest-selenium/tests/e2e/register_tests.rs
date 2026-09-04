use allure_cargotest::allure_test;
use tests_rust_testing_reqwest_selenium as tests;

const LOGIN_REQUIRED_MESSAGE: &str = "Login is required (minimum 3 characters)";
const LOGIN_MIN_LENGTH_MESSAGE: &str = "Login must be at least 3 characters";
const PASSWORD_REQUIRED_MESSAGE: &str = "Password is required (minimum 6 characters)";
const PASSWORD_MISMATCH_MESSAGE: &str = "Passwords do not match";
const PASSWORD_MIN_LENGTH_MESSAGE: &str = "Password must be at least 6 characters";
const BOTH_REQUIRED_MESSAGE: &str =
    "Login and password are required (minimum 3 and 6 characters)";
const DUPLICATE_USERNAME_MESSAGE: &str = "Username already taken";
const REGISTER_PASSWORD: &str = "password123";

fn layer() {
    tests::layer_e2e("Register", "Authentication", "Register", "critical");
}

#[allure_test(name = "New user can register and land on home")]
#[tokio::test]
async fn should_register_new_user() {
    layer();
    allure_rust_commons::tag("positive");
    let user = tests::UserBuilder::new().with_username().with_password().build();
    tests::with_browser({
        let username = user.username.clone();
        let password = user.password.clone();
        let welcome = user.welcome_message();
        move || async move {
            tests::RegisterPage::default()
                .open_page()
                .await
                .fill_and_submit_form(&username, &password, &password)
                .await
                .should_have_welcome_message(&welcome)
                .await;
        }
    })
    .await;
    tests::delete_account_quietly(allure.clone(), &user.username, &user.password).await;
}

#[allure_test(name = "New user can register with 3-character login and 6-character password")]
#[tokio::test]
async fn should_register_with_minimum_length_credentials() {
    layer();
    allure_rust_commons::tag("positive");
    let user = tests::UserBuilder::new().with_min_length_credentials().build();
    tests::with_browser({
        let username = user.username.clone();
        let password = user.password.clone();
        let welcome = user.welcome_message();
        move || async move {
            tests::RegisterPage::default()
                .open_page()
                .await
                .fill_and_submit_form(&username, &password, &password)
                .await
                .should_have_welcome_message(&welcome)
                .await;
        }
    })
    .await;
    tests::delete_account_quietly(allure.clone(), &user.username, &user.password).await;
}

#[allure_test(name = "Password mismatch shows validation error")]
#[tokio::test]
async fn should_show_error_when_passwords_do_not_match() {
    layer();
    allure_rust_commons::tag("negative");
    tests::with_browser(|| async {
        tests::RegisterPage::default()
            .open_page()
            .await
            .type_username("newuser")
            .await
            .type_password("password123")
            .await
            .type_confirm_password("password124")
            .await
            .submit_expecting_error()
            .await
            .should_have_error_message(PASSWORD_MISMATCH_MESSAGE)
            .await;
    })
    .await;
}

#[allure_test(name = "Short password shows validation error")]
#[tokio::test]
async fn should_show_error_when_password_is_too_short() {
    layer();
    allure_rust_commons::tag("negative");
    tests::with_browser(|| async {
        tests::RegisterPage::default()
            .open_page()
            .await
            .type_username("newuser")
            .await
            .type_password("abc")
            .await
            .type_confirm_password("abc")
            .await
            .submit_expecting_error()
            .await
            .should_have_error_message(PASSWORD_MIN_LENGTH_MESSAGE)
            .await;
    })
    .await;
}

#[allure_test(name = "Duplicate username shows readable error")]
#[tokio::test]
async fn should_show_error_when_username_is_taken() {
    layer();
    allure_rust_commons::tag("negative");
    tests::with_browser(|| async {
        tests::RegisterPage::default()
            .open_page()
            .await
            .type_username("user1")
            .await
            .type_password(REGISTER_PASSWORD)
            .await
            .type_confirm_password(REGISTER_PASSWORD)
            .await
            .submit_expecting_error()
            .await
            .should_have_error_message(DUPLICATE_USERNAME_MESSAGE)
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
        tests::RegisterPage::default()
            .open_page()
            .await
            .type_username("ab")
            .await
            .type_password("password123")
            .await
            .type_confirm_password("password123")
            .await
            .submit_expecting_error()
            .await
            .should_have_error_message(LOGIN_MIN_LENGTH_MESSAGE)
            .await;
    })
    .await;
}

#[allure_test(name = "Empty username shows validation error")]
#[tokio::test]
async fn should_show_validation_error_when_username_is_empty() {
    layer();
    allure_rust_commons::tag("negative");
    tests::with_browser(|| async {
        tests::RegisterPage::default()
            .open_page()
            .await
            .type_password("password123")
            .await
            .type_confirm_password("password123")
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
        tests::RegisterPage::default()
            .open_page()
            .await
            .type_username("newuser")
            .await
            .submit_expecting_error()
            .await
            .should_have_error_message(PASSWORD_REQUIRED_MESSAGE)
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
        tests::RegisterPage::default()
            .open_page()
            .await
            .submit_expecting_error()
            .await
            .should_have_error_message(BOTH_REQUIRED_MESSAGE)
            .await;
    })
    .await;
}
