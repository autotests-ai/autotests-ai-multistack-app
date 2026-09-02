"""CDP viewport — mirrors Java ViewportHelper (deviceScaleFactor=1)."""

from __future__ import annotations

from selenium.webdriver.remote.webdriver import WebDriver


def reset_viewport(driver: WebDriver, browser_size: str = "1920x1280") -> None:
    try:
        driver.execute_cdp_cmd("Emulation.clearDeviceMetricsOverride", {})
        return
    except Exception:
        pass
    width, height = _parse_browser_size(browser_size)
    driver.set_window_size(width, height)


def set_viewport(driver: WebDriver, width: int, height: int) -> None:
    try:
        driver.execute_cdp_cmd("Emulation.clearDeviceMetricsOverride", {})
    except Exception:
        pass
    metrics = {
        "width": int(width),
        "height": int(height),
        "deviceScaleFactor": 1,
        "mobile": False,
    }
    try:
        driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride", metrics)
    except Exception:
        driver.set_window_size(width, height)


def _parse_browser_size(browser_size: str) -> tuple[int, int]:
    parts = browser_size.lower().split("x")
    if len(parts) != 2:
        raise ValueError(f"Invalid browserSize: {browser_size}")
    return int(parts[0].strip()), int(parts[1].strip())
