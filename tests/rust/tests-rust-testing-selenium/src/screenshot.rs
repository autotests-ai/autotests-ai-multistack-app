use std::io::Cursor;
use std::path::{Path, PathBuf};

use image::{Rgba, RgbaImage};
use thirtyfour::WebElement;

use crate::config::{load_config, module_dir};
use crate::local_chrome_pin;

const DIFF_DIR: &str = "screenshot-diff";
const DIFF_HIGHLIGHT: Rgba<u8> = Rgba([255, 0, 255, 255]);
const SIZE_MISMATCH: Rgba<u8> = Rgba([255, 0, 0, 255]);

pub async fn capture_and_compare(
    element: &WebElement,
    area: &str,
    viewport: i32,
    attachment_name: &str,
) {
    let displayed = element.is_displayed().await.unwrap_or(false);
    if !displayed {
        panic!("Screenshot target is not displayed: {area}");
    }
    let actual = element
        .screenshot_as_png()
        .await
        .unwrap_or_else(|err| panic!("element screenshot: {err}"));
    let label = format!("{area}/{viewport}");
    let screenshot_path = screenshot_file_path(area, viewport);
    let screenshot_present = screenshot_exists(area, viewport);

    if should_update_screenshots() {
        allure_rust_commons::step(&format!("Update screenshot: {attachment_name}"), || {
            attach_update_mode(attachment_name, &actual, screenshot_present, area, viewport);
        });
        write_screenshot(&screenshot_path, &actual);
        return;
    }

    if !screenshot_present {
        allure_rust_commons::step(&format!("Missing screenshot: {attachment_name}"), || {
            attach_png(&format!("{attachment_name}-actual-unmatched"), &actual);
        });
        panic!(
            "Screenshot missing for {label}. Commit PNG to {} or run with UPDATE_SCREENSHOTS=true",
            screenshot_resource_path(area, viewport)
        );
    }

    let expected = read_expected_screenshot(area, viewport);
    let comparison = compare_images(&expected, &actual, &label);
    allure_rust_commons::step(&format!("Compare screenshot: {attachment_name}"), || {
        if comparison.passed {
            attach_png(attachment_name, &actual);
            return;
        }
        attach_png(&format!("{attachment_name}-expected"), &expected);
        attach_png(&format!("{attachment_name}-actual"), &actual);
        attach_png(&format!("{attachment_name}-diff"), &comparison.diff_png);
        save_fail_artifacts(&label, &actual, &comparison.diff_png);
        panic!("{}", comparison.message);
    });
}

pub fn screenshot_mode() -> String {
    screenshot_mode_for(&load_config().stand).expect("screenshot folder")
}

pub fn screenshot_mode_for(env: &str) -> Result<String, String> {
    let key = env.trim();
    match key {
        "mock" => Ok("mock".into()),
        "stage" => Ok("stage".into()),
        "prod" | "ci" | "" => Ok("prod".into()),
        _ => Err(format!(
            "screenshot folder: unknown env '{key}' (use mock, stage, prod, or ci)"
        )),
    }
}

pub fn screenshot_os() -> String {
    let override_os = std::env::var("SCREENSHOT_OS").unwrap_or_default();
    let raw = if !override_os.trim().is_empty() {
        override_os.trim().to_string()
    } else {
        os_family()
    };
    map_screenshot_os(&raw)
}

pub fn screenshot_browser_folder() -> String {
    format!("{}-{}", screenshot_browser(), screenshot_browser_major())
}

fn attach_update_mode(
    attachment_name: &str,
    actual: &[u8],
    screenshot_present: bool,
    area: &str,
    viewport: i32,
) {
    if screenshot_present {
        attach_png(
            &format!("{attachment_name}-screenshot-old"),
            &read_expected_screenshot(area, viewport),
        );
        attach_png(&format!("{attachment_name}-screenshot-new"), actual);
        return;
    }
    attach_png(&format!("{attachment_name}-screenshot-new"), actual);
}

fn attach_png(name: &str, png: &[u8]) {
    allure_rust_commons::attachment(name, "image/png", png);
}

fn should_update_screenshots() -> bool {
    load_config().update_screenshots
}

fn screenshots_dir() -> String {
    let dir = load_config().screenshots_dir.trim().replace('\\', "/");
    if dir.is_empty() {
        panic!("screenshotsDir must not be empty");
    }
    dir.trim_end_matches('/').to_string()
}

fn screenshot_browser() -> String {
    let override_browser = std::env::var("SCREENSHOT_BROWSER").unwrap_or_default();
    if !override_browser.trim().is_empty() {
        override_browser.trim().to_ascii_lowercase()
    } else {
        "chrome".into()
    }
}

fn screenshot_browser_major() -> String {
    local_chrome_pin::pinned_version()
        .map(|v| local_chrome_pin::major(&v))
        .unwrap_or_else(|_| "148".into())
}

fn os_family() -> String {
    match std::env::consts::OS {
        "macos" => "darwin".into(),
        "windows" => "win32".into(),
        _ => "linux".into(),
    }
}

fn map_screenshot_os(raw: &str) -> String {
    let key = raw.to_ascii_lowercase();
    if key == "darwin" || key == "macos" || key.starts_with("mac") {
        return "macos".into();
    }
    if key == "win32" || key == "windows" || key.starts_with("win") {
        return "windows".into();
    }
    if key == "linux" || key.contains("linux") {
        return "linux".into();
    }
    if key.is_empty() {
        "linux".into()
    } else {
        key
    }
}

fn screenshot_file_path(area: &str, viewport: i32) -> PathBuf {
    module_dir()
        .join(screenshots_dir())
        .join(screenshot_mode())
        .join(screenshot_os())
        .join(screenshot_browser_folder())
        .join(area)
        .join(format!("{viewport}.png"))
}

fn screenshot_resource_path(area: &str, viewport: i32) -> String {
    format!(
        "{}/{}/{}/{}/{}/{}.png",
        screenshots_dir(),
        screenshot_mode(),
        screenshot_os(),
        screenshot_browser_folder(),
        area,
        viewport
    )
}

fn screenshot_exists(area: &str, viewport: i32) -> bool {
    screenshot_file_path(area, viewport).is_file()
}

fn read_expected_screenshot(area: &str, viewport: i32) -> Vec<u8> {
    let path = screenshot_file_path(area, viewport);
    std::fs::read(&path).unwrap_or_else(|_| {
        panic!(
            "Screenshot not found: {}",
            screenshot_resource_path(area, viewport)
        )
    })
}

fn write_screenshot(screenshot_path: &Path, png: &[u8]) {
    if let Some(parent) = screenshot_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    std::fs::write(screenshot_path, png).expect("write screenshot");
}

struct ImageComparison {
    passed: bool,
    diff_png: Vec<u8>,
    message: String,
}

fn compare_images(expected_bytes: &[u8], actual_bytes: &[u8], label: &str) -> ImageComparison {
    let expected = image::load_from_memory(expected_bytes)
        .expect("expected png")
        .to_rgba8();
    let actual = image::load_from_memory(actual_bytes)
        .expect("actual png")
        .to_rgba8();
    let diff_png = create_diff_png(&expected, &actual);

    if expected.width() != actual.width() || expected.height() != actual.height() {
        return ImageComparison {
            passed: false,
            diff_png,
            message: format!(
                "Screenshot size changed for {label}: expected {}x{}, actual {}x{}",
                expected.width(),
                expected.height(),
                actual.width(),
                actual.height()
            ),
        };
    }

    let width = expected.width();
    let height = expected.height();
    let mut diff_pixels = 0u64;
    for y in 0..height {
        for x in 0..width {
            if expected.get_pixel(x, y) != actual.get_pixel(x, y) {
                diff_pixels += 1;
            }
        }
    }
    let total_pixels = u64::from(width) * u64::from(height);
    let max_diff_ratio = load_config().screenshot_diff_threshold;
    let diff_ratio = diff_pixels as f64 / total_pixels as f64;
    if diff_ratio > max_diff_ratio {
        return ImageComparison {
            passed: false,
            diff_png,
            message: format!(
                "Screenshot diff too high for {label}: {:.2}% > {:.2}%",
                diff_ratio * 100.0,
                max_diff_ratio * 100.0
            ),
        };
    }
    ImageComparison {
        passed: true,
        diff_png,
        message: String::new(),
    }
}

fn create_diff_png(expected: &RgbaImage, actual: &RgbaImage) -> Vec<u8> {
    let width = expected.width().max(actual.width());
    let height = expected.height().max(actual.height());
    let mut diff = RgbaImage::new(width, height);
    for y in 0..height {
        for x in 0..width {
            let in_expected = x < expected.width() && y < expected.height();
            let in_actual = x < actual.width() && y < actual.height();
            let pixel = if in_expected && in_actual {
                let expected_rgb = *expected.get_pixel(x, y);
                if expected_rgb == *actual.get_pixel(x, y) {
                    dim(expected_rgb)
                } else {
                    DIFF_HIGHLIGHT
                }
            } else {
                SIZE_MISMATCH
            };
            diff.put_pixel(x, y, pixel);
        }
    }
    encode_png(&diff)
}

fn dim(rgb: Rgba<u8>) -> Rgba<u8> {
    let gray = ((u16::from(rgb[0]) + u16::from(rgb[1]) + u16::from(rgb[2])) / 9) as u8;
    Rgba([gray, gray, gray, 255])
}

fn encode_png(img: &RgbaImage) -> Vec<u8> {
    let mut buf = Vec::new();
    img.write_to(&mut Cursor::new(&mut buf), image::ImageFormat::Png)
        .expect("png encode");
    buf
}

fn save_fail_artifacts(label: &str, actual: &[u8], diff: &[u8]) {
    let dir = module_dir().join(DIFF_DIR);
    if std::fs::create_dir_all(&dir).is_err() {
        return;
    }
    let prefix = label.replace('/', "_");
    let _ = std::fs::write(dir.join(format!("{prefix}-actual.png")), actual);
    let _ = std::fs::write(dir.join(format!("{prefix}-diff.png")), diff);
}
