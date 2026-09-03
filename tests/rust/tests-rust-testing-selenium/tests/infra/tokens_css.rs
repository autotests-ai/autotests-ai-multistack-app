use std::path::{Path, PathBuf};

use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

fn abs(path: &Path) -> PathBuf {
    std::path::absolute(path).unwrap_or_else(|_| path.to_path_buf())
}

fn write_tokens(file: &Path) -> PathBuf {
    if let Some(parent) = file.parent() {
        std::fs::create_dir_all(parent).expect("mkdir");
    }
    std::fs::write(file, ":root { --x: 1px; }").expect("write tokens");
    file.to_path_buf()
}

fn layer() {
    tests::layer_infra("TokensCss", "Test infra", "Tokens CSS", "normal");
}

#[allure_test(name = "tokens.css keeps canonical component size tokens")]
#[test]
fn tokens_match_component_sizes_canon() {
    layer();
    let tokens = tests::parse_root_tokens(tests::default_tokens_path()).expect("tokens");
    for (token, expected) in [
        ("--control-height-md", "36px"),
        ("--icon-size-md", "18px"),
        ("--input-min-width", "200px"),
        ("--header-height", "40px"),
    ] {
        assert!(tokens.contains_key(token), "Missing token: {token}");
        assert_eq!(tokens.get(token).map(String::as_str), Some(expected));
    }
}

#[allure_test(name = "defaultTokensPath resolves an existing tokens.css")]
#[test]
fn default_tokens_path_resolves_existing_file() {
    layer();
    assert!(tests::default_tokens_path().is_file());
}

#[allure_test(name = "firstExisting returns the first path that exists")]
#[test]
fn first_existing_returns_first_hit() {
    layer();
    let temp = tempfile();
    let missing = temp.join("missing.css");
    let hit = temp.join("hit.css");
    let later = temp.join("later.css");
    std::fs::write(&hit, ":root { --x: 1px; }").unwrap();
    std::fs::write(&later, ":root { --y: 2px; }").unwrap();
    assert_eq!(tests::first_existing(&[&missing, &hit, &later]), abs(&hit));
}

#[allure_test(name = "firstExisting returns the last path when none exist")]
#[test]
fn first_existing_returns_last_when_none_exist() {
    layer();
    let temp = tempfile();
    let missing = temp.join("missing.css");
    let fallback = temp.join("fallback.css");
    assert_eq!(tests::first_existing(&[&missing, &fallback]), abs(&fallback));
}

#[allure_test(name = "resolveFromAppRoot prefers the frontend hub over any vendor copy")]
#[test]
fn resolve_from_app_root_prefers_hub() {
    layer();
    let temp = tempfile();
    let hub = write_tokens(&temp.join("frontend/_shared/frontend-javascript-app/css/tokens.css"));
    write_tokens(&temp.join(
        "frontend/javascript/frontend-javascript-vue/vendor/ds/css/tokens.css",
    ));
    assert_eq!(tests::resolve_from_app_root(&temp), abs(&hub));
}

#[allure_test(name = "resolveFromAppRoot finds vendor/ds on javascript-vue when hub is missing")]
#[test]
fn resolve_from_app_root_finds_vue_vendor_when_hub_missing() {
    layer();
    let temp = tempfile();
    let vue = write_tokens(&temp.join(
        "frontend/javascript/frontend-javascript-vue/vendor/ds/css/tokens.css",
    ));
    assert_eq!(tests::resolve_from_app_root(&temp), abs(&vue));
}

#[allure_test(name = "resolveFromAppRoot ignores scripts/.github/node_modules and uses a product cell")]
#[test]
fn resolve_from_app_root_skips_non_product_frontend_dirs() {
    layer();
    let temp = tempfile();
    write_tokens(&temp.join("frontend/scripts/not-a-cell/vendor/ds/css/tokens.css"));
    write_tokens(&temp.join("frontend/.github/workflows/vendor/ds/css/tokens.css"));
    write_tokens(&temp.join("frontend/node_modules/pkg/vendor/ds/css/tokens.css"));
    write_tokens(&temp.join("frontend/javascript/.github/vendor/ds/css/tokens.css"));
    let vue = write_tokens(&temp.join(
        "frontend/javascript/frontend-javascript-vue/vendor/ds/css/tokens.css",
    ));
    assert_eq!(tests::resolve_from_app_root(&temp), abs(&vue));
}

#[allure_test(name = "resolveFromAppRoot falls back to vendor/frontend-javascript-app when vendor/ds is missing")]
#[test]
fn resolve_from_app_root_falls_back_to_vendored_app() {
    layer();
    let temp = tempfile();
    let baked = write_tokens(&temp.join(
        "frontend/javascript/frontend-javascript-vue/vendor/frontend-javascript-app/css/tokens.css",
    ));
    assert_eq!(tests::resolve_from_app_root(&temp), abs(&baked));
}

#[allure_test(name = "resolveFromAppRoot falls back to hub path when frontend tree is missing")]
#[test]
fn resolve_from_app_root_falls_back_to_hub_when_frontend_missing() {
    layer();
    let temp = tempfile();
    let hub = temp.join("frontend/_shared/frontend-javascript-app/css/tokens.css");
    assert_eq!(tests::resolve_from_app_root(&temp), abs(&hub));
}

#[allure_test(name = "parseRootTokens rejects css without :root block")]
#[test]
fn parse_root_tokens_rejects_missing_root_block() {
    layer();
    let temp = tempfile();
    let css = temp.join("tokens-invalid.css");
    std::fs::write(&css, "body { color: red; }").unwrap();
    let err = tests::parse_root_tokens(&css).expect_err("no :root");
    assert!(err.contains(":root block not found"), "{err}");
}

fn tempfile() -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let dir = std::env::temp_dir().join(format!("tokens-css-{nanos}"));
    std::fs::create_dir_all(&dir).expect("temp");
    dir
}
