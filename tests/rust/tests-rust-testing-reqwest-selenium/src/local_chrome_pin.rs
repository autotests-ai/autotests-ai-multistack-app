use std::path::{Path, PathBuf};

use crate::config::module_dir;

const PIN_FILE: &str = "chrome-for-testing.properties";
const INSTALLER: &str = "scripts/install-chrome-for-testing.sh";

#[derive(Debug, Clone)]
pub struct ChromeBinaries {
    pub chrome: PathBuf,
    pub driver: PathBuf,
}

/// Pins local Chrome to the Chrome for Testing build in `chrome-for-testing.properties`.
pub fn apply(browser_version: &str) -> Result<ChromeBinaries, String> {
    resolve(browser_version)
}

pub fn resolve(browser_version: &str) -> Result<ChromeBinaries, String> {
    if browser_version.trim().is_empty() {
        return Err(
            "browserVersion is required for local Chrome (canon: 148). \
             Do not run e2e on system Chrome without explicit override."
                .into(),
        );
    }
    let version = pinned_version()?;
    require_same_major(browser_version, &version)?;

    let chrome = executable_override("CHROME_BINARY_PATH").unwrap_or_else(|| chrome_binary(&version));
    if !is_executable(&chrome) {
        return Err(not_installed(
            &format!("Chrome {version} browser binary"),
            &chrome,
        ));
    }

    let mut driver =
        executable_override("CHROMEDRIVER_PATH").unwrap_or_else(|| chromedriver_path(&version));
    if !is_executable(&driver) {
        let cached = selenium_cache_driver(&version);
        if !is_executable(&cached) {
            return Err(not_installed(
                &format!("chromedriver for Chrome {version}"),
                &driver,
            ));
        }
        driver = cached;
    }

    Ok(ChromeBinaries { chrome, driver })
}

pub fn pinned_version() -> Result<String, String> {
    let override_version = std::env::var("CHROME_FOR_TESTING_VERSION").unwrap_or_default();
    if !override_version.trim().is_empty() {
        return Ok(override_version.trim().to_string());
    }
    let path = pin_path();
    if !path.is_file() {
        return Err(format!("{PIN_FILE} is missing from the tests module"));
    }
    let text = std::fs::read_to_string(&path).map_err(|err| err.to_string())?;
    for line in text.lines() {
        let trimmed = line.trim();
        if let Some(version) = trimmed.strip_prefix("version=") {
            let version = version.trim();
            if !version.is_empty() {
                return Ok(version.to_string());
            }
        }
    }
    Err(format!("No version= entry in {PIN_FILE}"))
}

fn pin_path() -> PathBuf {
    module_dir().join(PIN_FILE)
}

fn executable_override(environment_variable: &str) -> Option<PathBuf> {
    let value = std::env::var(environment_variable).ok()?;
    let trimmed = value.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(PathBuf::from(trimmed))
    }
}

fn require_same_major(browser_version: &str, pinned_version: &str) -> Result<(), String> {
    let requested = major(browser_version);
    let pinned = major(pinned_version);
    if requested != pinned {
        return Err(format!(
            "browserVersion={browser_version} asks for Chrome {requested}, but the pinned build is {pinned_version}. \
             Align them: bump version= in {PIN_FILE}, or set browserVersion to {pinned}."
        ));
    }
    Ok(())
}

pub fn major(version: &str) -> String {
    version.split('.').next().unwrap_or(version).to_string()
}

fn chrome_for_testing_root() -> PathBuf {
    if let Ok(override_path) = std::env::var("CHROME_FOR_TESTING_PATH") {
        let trimmed = override_path.trim();
        if !trimmed.is_empty() {
            return PathBuf::from(trimmed);
        }
    }
    home_dir().join(".local/share/chrome-for-testing")
}

fn home_dir() -> PathBuf {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."))
}

fn platform_dir() -> Result<&'static str, String> {
    match std::env::consts::OS {
        "macos" => {
            if std::env::consts::ARCH == "aarch64" {
                Ok("mac_arm")
            } else {
                Ok("mac")
            }
        }
        "linux" => Ok("linux"),
        other => Err(format!("Unsupported OS for LocalChromePin: {other}")),
    }
}

fn selenium_cache_arch(platform: &str) -> Result<&'static str, String> {
    match platform {
        "mac_arm" => Ok("mac-arm64"),
        "mac" => Ok("mac-x64"),
        "linux" => Ok("linux64"),
        other => Err(format!("Unsupported platform: {other}")),
    }
}

fn chrome_binary(version: &str) -> PathBuf {
    let platform = platform_dir().unwrap_or("linux");
    let version_dir = chrome_for_testing_root().join("chrome").join(format!("{platform}-{version}"));
    match platform {
        "mac_arm" => version_dir.join(
            "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        ),
        "mac" => version_dir.join(
            "chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        ),
        _ => version_dir.join("chrome-linux64/chrome"),
    }
}

fn chromedriver_path(version: &str) -> PathBuf {
    let platform = platform_dir().unwrap_or("linux");
    let version_dir = chrome_for_testing_root()
        .join("chromedriver")
        .join(format!("{platform}-{version}"));
    match platform {
        "mac_arm" => version_dir.join("chromedriver-mac-arm64/chromedriver"),
        "mac" => version_dir.join("chromedriver-mac-x64/chromedriver"),
        _ => version_dir.join("chromedriver-linux64/chromedriver"),
    }
}

fn selenium_cache_driver(version: &str) -> PathBuf {
    let platform = platform_dir().unwrap_or("linux");
    let arch = selenium_cache_arch(platform).unwrap_or("linux64");
    home_dir()
        .join(".cache/selenium/chromedriver")
        .join(arch)
        .join(version)
        .join("chromedriver")
}

fn is_executable(path: &Path) -> bool {
    path.is_file()
}

fn not_installed(what: &str, expected: &Path) -> String {
    format!(
        "{what} not found at {}. Install the pinned build (not system Chrome), from the tests module root:\n  {INSTALLER}",
        expected.display()
    )
}
