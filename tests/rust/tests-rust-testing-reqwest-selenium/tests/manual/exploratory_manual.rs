use allure_cargotest::allure_test;
use tests_rust_testing_reqwest_selenium as tests;

#[allure_test(name = "Home residual: 390px viewport and offline error")]
#[test]
fn home_residual_charter() {
    tests::layer_manual("Exploratory manual", "Exploratory", "Manual checklist", "normal");
    allure.step("Open / and let health + items load", || {});
    allure.step("Narrow the viewport to 390px — cards stack, nothing overflows", || {});
    allure.step(
        "Kill the network (offline devtools) and reload — items panel shows a readable error, not a blank page",
        || {},
    );
}

#[allure_test(name = "Security residual: XSS, second tab, JWT expiry")]
#[test]
fn security_residual_charter() {
    tests::layer_manual("Exploratory manual", "Exploratory", "Manual checklist", "normal");
    allure.step("Register with an XSS / HTML payload in the username — Welcome panel and header show escaped text, no alert", || {});
    allure.step(
        "Sign in in a second tab, logout in the first — observe what the second tab shows on next action",
        || {},
    );
    allure.step(
        "Wait for token expiry (or shrink JWT_EXPIRATION_MS on a local stand) — expired session degrades to logged-out, not an error page",
        || {},
    );
}
