use allure_rust_commons::{epic, feature, label, owner, severity, suite, tag};

use crate::config::ensure_allure_results_dir;

const MODULE: &str = "tests-rust-testing-reqwest";

fn common_meta() {
    ensure_allure_results_dir();
    owner("stanislav");
    label("module", MODULE);
    label("language", "rust");
}

pub fn layer_api(suite_name: &str, epic_name: &str, feature_name: &str, severity_name: &str) {
    common_meta();
    suite(suite_name);
    epic(epic_name);
    feature(feature_name);
    severity(severity_name);
    label("layer", "api");
    tag("api");
    label("framework", "reqwest");
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
