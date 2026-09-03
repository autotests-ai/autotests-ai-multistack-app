use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use crate::config::module_dir;

pub fn default_tokens_path() -> PathBuf {
    let app_root = module_dir().join("../../..");
    let app_root = app_root.canonicalize().unwrap_or(app_root);
    resolve_from_app_root(app_root)
}

pub fn resolve_from_app_root(app_root: impl AsRef<Path>) -> PathBuf {
    first_existing(&tokens_css_candidates(app_root.as_ref()))
}

pub fn first_existing<P: AsRef<Path>>(candidates: &[P]) -> PathBuf {
    assert!(!candidates.is_empty(), "tokens.css candidates");
    let mut fallback = abs(candidates[candidates.len() - 1].as_ref());
    for candidate in candidates {
        let full = abs(candidate.as_ref());
        if full.is_file() {
            return full;
        }
        fallback = full;
    }
    fallback
}

pub fn parse_root_tokens(css_file: impl AsRef<Path>) -> Result<BTreeMap<String, String>, String> {
    let css_file = css_file.as_ref();
    let css = std::fs::read_to_string(css_file)
        .map_err(|err| format!("read {}: {err}", css_file.display()))?;
    let Some(root_at) = css.find(":root") else {
        return Err(format!(":root block not found in {}", css_file.display()));
    };
    let after_root = &css[root_at..];
    let Some(brace) = after_root.find('{') else {
        return Err(format!(":root block not found in {}", css_file.display()));
    };
    let inner = &after_root[brace + 1..];
    let Some(end) = inner.find('}') else {
        return Err(format!(":root block not found in {}", css_file.display()));
    };
    let mut tokens = BTreeMap::new();
    let mut search = &inner[..end];
    while let Some(rel) = search.find("--") {
        let rest = &search[rel..];
        let name: String = rest
            .chars()
            .take_while(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_')
            .collect();
        let after_name = &rest[name.len()..];
        let trimmed = after_name.trim_start();
        if let Some(after_colon) = trimmed.strip_prefix(':') {
            let value_src = after_colon.trim_start();
            if let Some(semi) = value_src.find(';') {
                tokens.insert(name, value_src[..semi].trim().to_string());
                search = &value_src[semi + 1..];
                continue;
            }
        }
        search = &rest[2..];
    }
    Ok(tokens)
}

fn tokens_css_candidates(app_root: &Path) -> Vec<PathBuf> {
    let mut candidates = vec![hub_tokens(app_root)];
    append_vendor_tokens(&app_root.join("frontend"), &mut candidates);
    candidates
}

fn hub_tokens(app_root: &Path) -> PathBuf {
    app_root.join("frontend/_shared/frontend-javascript-app/css/tokens.css")
}

fn append_vendor_tokens(frontend_root: &Path, output: &mut Vec<PathBuf>) {
    let Ok(langs) = std::fs::read_dir(frontend_root) else {
        return;
    };
    let mut langs: Vec<_> = langs.filter_map(|e| e.ok()).collect();
    langs.sort_by(|a, b| a.file_name().cmp(&b.file_name()));
    for lang in langs {
        let lang_path = lang.path();
        if !lang_path.is_dir() || !is_product_language_dir(&lang_path) {
            continue;
        }
        let Ok(cells) = std::fs::read_dir(&lang_path) else {
            continue;
        };
        let mut cells: Vec<_> = cells.filter_map(|e| e.ok()).collect();
        cells.sort_by(|a, b| a.file_name().cmp(&b.file_name()));
        for cell in cells {
            let cell_path = cell.path();
            if !cell_path.is_dir() {
                continue;
            }
            let name = cell_path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or_default();
            if name.starts_with('.') {
                continue;
            }
            output.push(cell_path.join("vendor/ds/css/tokens.css"));
            output.push(cell_path.join("vendor/frontend-javascript-app/css/tokens.css"));
        }
    }
}

fn is_product_language_dir(path: &Path) -> bool {
    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or_default();
    !name.starts_with('.')
        && !name.starts_with('_')
        && name != "scripts"
        && name != "node_modules"
}

fn abs(path: &Path) -> PathBuf {
    std::path::absolute(path).unwrap_or_else(|_| path.to_path_buf())
}
