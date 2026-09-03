use allure_cargotest::allure_test;
use tests_rust_testing_reqwest as tests;

#[allure_test(name = "Auth happy path across login → home → logout")]
#[test]
fn auth_happy_path_checklist() {
    tests::layer_manual("Exploratory manual", "Exploratory", "Manual checklist", "normal");
    allure.step("Open /login and sign in as seeded user1 / password1", || {});
    allure.step("Confirm welcome panel shows Welcome, user1!", || {});
    allure.step("Logout and land on /login with empty session", || {});
}

#[allure_test(name = "Items catalogue: content, order and resilience charter")]
#[test]
fn items_catalogue_charter() {
    tests::layer_manual("Exploratory manual", "Exploratory", "Manual checklist", "normal");
    allure.step("Open / and let health + items load", || {});
    allure.step(
        "Check items render Alpha, Beta, Gamma in stable id order with descriptions",
        || {},
    );
    allure.step("Narrow the viewport to 390px — cards stack, nothing overflows", || {});
    allure.step(
        "Kill the network (offline devtools) and reload — items panel shows a readable error, not a blank page",
        || {},
    );
}

#[allure_test(name = "Session and token edge cases charter")]
#[test]
fn session_token_charter() {
    tests::layer_manual("Exploratory manual", "Exploratory", "Manual checklist", "normal");
    allure.step("Sign in, reload — welcome survives (token in localStorage)", || {});
    allure.step(
        "Replace the stored token with garbage in devtools, reload — session is cleared, no crash",
        || {},
    );
    allure.step(
        "Sign in in a second tab, logout in the first — observe what the second tab shows on next action",
        || {},
    );
    allure.step(
        "Wait for token expiry (or shrink JWT_EXPIRATION_MS on a local stand) — expired session degrades to logged-out, not an error page",
        || {},
    );
}
