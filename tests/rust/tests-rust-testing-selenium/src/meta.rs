use allure_rust_commons::{epic, feature, label, owner, severity, suite, tag};

use crate::config::ensure_allure_results_dir;

const MODULE: &str = "tests-rust-testing-selenium";

fn common_meta() {
    ensure_allure_results_dir();
    owner("stanislav");
    label("module", MODULE);
    label("language", "rust");
}

pub fn layer_infra(suite_name: &str, epic_name: &str, feature_name: &str, severity_name: &str) {
    common_meta();
    suite(suite_name);
    epic(epic_name);
    feature(feature_name);
    severity(severity_name);
    label("layer", "infra");
    tag("infra");
    tag("infra-backend");
}

pub fn layer_ui(suite_name: &str, epic_name: &str, feature_name: &str, severity_name: &str) {
    common_meta();
    suite(suite_name);
    epic(epic_name);
    feature(feature_name);
    severity(severity_name);
    label("layer", "ui");
    tag("ui");
    label("framework", "selenium");
}

pub fn layer_e2e(suite_name: &str, epic_name: &str, feature_name: &str, severity_name: &str) {
    common_meta();
    suite(suite_name);
    epic(epic_name);
    feature(feature_name);
    severity(severity_name);
    label("layer", "e2e");
    tag("e2e");
    label("framework", "selenium");
}
