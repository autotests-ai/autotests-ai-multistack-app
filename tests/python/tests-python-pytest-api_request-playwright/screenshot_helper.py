"""PNG capture/compare — mirrors Java ScreenshotHelper (LAYERS.md Mock and screenshot)."""

from __future__ import annotations

import io
import os
import sys
from pathlib import Path

import allure
from PIL import Image
from config import load_config

_ROOT = Path(__file__).resolve().parent
_DIFF_DIR = _ROOT / "build" / "screenshot-diff"
_DIFF_HIGHLIGHT = (255, 0, 255)
_SIZE_MISMATCH = (255, 0, 0)


def capture_and_compare(locator, area: str, viewport: int, attachment_name: str) -> None:
    wait_for_stable_layout(locator.page)
    actual = locator.screenshot()
    label = f"{area}/{viewport}"
    screenshot_path = screenshot_file_path(area, viewport)
    present = screenshot_path.is_file()

    if _should_update():
        with allure.step(f"Update screenshot: {attachment_name}"):
            _attach_update_mode(attachment_name, actual, present, area, viewport)
        _write_screenshot(screenshot_path, actual)
        return

    if not present:
        with allure.step(f"Missing screenshot: {attachment_name}"):
            _attach_png(f"{attachment_name}-actual-unmatched", actual)
        resource = screenshot_resource_path(area, viewport)
        raise AssertionError(
            f"Screenshot missing for {label}. Commit PNG to src/test/resources/{resource} "
            "or run with UPDATE_SCREENSHOTS=true"
        )

    expected = screenshot_path.read_bytes()
    passed, diff_png, message = compare_images(expected, actual, label)
    with allure.step(f"Compare screenshot: {attachment_name}"):
        if passed:
            _attach_png(attachment_name, actual)
            return
        _attach_png(f"{attachment_name}-expected", expected)
        _attach_png(f"{attachment_name}-actual", actual)
        _attach_png(f"{attachment_name}-diff", diff_png)
        _save_fail_artifacts(label, actual, diff_png)
        raise AssertionError(message)


def wait_for_stable_layout(page) -> None:
    page.evaluate(
        """() => Promise.all([
          document.fonts.ready,
          new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
        ])"""
    )


def screenshot_mode(env: str | None = None) -> str:
    if env is None:
        env = os.environ.get("STAND") or os.environ.get("ENV") or ""
    key = (env or "").strip()
    if key == "mock":
        return "mock"
    if key == "stage":
        return "stage"
    if key in {"prod", "ci", ""}:
        return "prod"
    raise ValueError(f"screenshot folder: unknown env '{key}' (use mock, stage, prod, or ci)")


def screenshot_os() -> str:
    override = os.environ.get("SCREENSHOT_OS")
    raw = override.strip() if override and override.strip() else _os_family()
    return _map_screenshot_os(raw)


def screenshot_browser_folder() -> str:
    return f"{screenshot_browser()}-{screenshot_browser_major()}"


def screenshot_browser() -> str:
    override = os.environ.get("SCREENSHOT_BROWSER")
    if override and override.strip():
        return override.strip().lower()
    return "chrome"


def screenshot_browser_major() -> str:
    return pinned_chrome_version().split(".", 1)[0]


def pinned_chrome_version() -> str:
    override = os.environ.get("CHROME_FOR_TESTING_VERSION", "").strip()
    if override:
        return override
    pin = _ROOT / "chrome-for-testing.properties"
    if not pin.is_file():
        raise RuntimeError(f"chrome-for-testing.properties is missing: {pin}")
    for line in pin.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if stripped.startswith("version="):
            value = stripped.split("=", 1)[1].strip()
            if value:
                return value
    raise RuntimeError("No version= entry in chrome-for-testing.properties")


def screenshot_file_path(area: str, viewport: int) -> Path:
    cfg = load_config()
    screenshots_dir = (cfg.screenshots_dir or "screenshots").replace("\\", "/").strip("/")
    return (
        _ROOT
        / "src"
        / "test"
        / "resources"
        / screenshots_dir
        / screenshot_mode(cfg.stand)
        / screenshot_os()
        / screenshot_browser_folder()
        / area
        / f"{viewport}.png"
    )


def screenshot_resource_path(area: str, viewport: int) -> str:
    cfg = load_config()
    screenshots_dir = (cfg.screenshots_dir or "screenshots").replace("\\", "/").strip("/")
    return (
        f"{screenshots_dir}/{screenshot_mode(cfg.stand)}/{screenshot_os()}/"
        f"{screenshot_browser_folder()}/{area}/{viewport}.png"
    )


def compare_images(expected_bytes: bytes, actual_bytes: bytes, label: str) -> tuple[bool, bytes, str | None]:
    expected = _read_image(expected_bytes)
    actual = _read_image(actual_bytes)
    diff_png = _create_diff_png(expected, actual)
    if expected.size != actual.size:
        return (
            False,
            diff_png,
            "Screenshot size changed for %s: expected %dx%d, actual %dx%d"
            % (label, expected.width, expected.height, actual.width, actual.height),
        )

    width, height = expected.size
    exp_bytes = expected.tobytes()
    act_bytes = actual.tobytes()
    diff_pixels = 0
    for i in range(0, len(exp_bytes), 3):
        if exp_bytes[i : i + 3] != act_bytes[i : i + 3]:
            diff_pixels += 1
    total = width * height
    max_diff = load_config().screenshot_diff_threshold
    ratio = diff_pixels / total if total else 1.0
    if ratio > max_diff:
        return (
            False,
            diff_png,
            "Screenshot diff too high for %s: %.2f%% > %.2f%%" % (label, ratio * 100, max_diff * 100),
        )
    return True, diff_png, None


def _should_update() -> bool:
    return load_config().update_screenshots


def _os_family() -> str:
    if sys.platform == "darwin":
        return "darwin"
    if sys.platform.startswith("win"):
        return "win32"
    return "linux"


def _map_screenshot_os(raw: str) -> str:
    key = raw.lower()
    if key in {"darwin", "macos"} or key.startswith("mac"):
        return "macos"
    if key in {"win32", "windows"} or key.startswith("win"):
        return "windows"
    if key == "linux" or "linux" in key:
        return "linux"
    return key if key else "linux"


def _attach_update_mode(
    attachment_name: str, actual: bytes, present: bool, area: str, viewport: int
) -> None:
    if present:
        _attach_png(f"{attachment_name}-screenshot-old", screenshot_file_path(area, viewport).read_bytes())
        _attach_png(f"{attachment_name}-screenshot-new", actual)
        return
    _attach_png(f"{attachment_name}-screenshot-new", actual)


def _attach_png(name: str, png: bytes) -> None:
    allure.attach(png, name=name, attachment_type=allure.attachment_type.PNG)


def _write_screenshot(path: Path, png: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def _save_fail_artifacts(label: str, actual: bytes, diff: bytes) -> None:
    try:
        _DIFF_DIR.mkdir(parents=True, exist_ok=True)
        prefix = label.replace("/", "_")
        (_DIFF_DIR / f"{prefix}-actual.png").write_bytes(actual)
        (_DIFF_DIR / f"{prefix}-diff.png").write_bytes(diff)
    except OSError:
        pass


def _read_image(data: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(data))
    if image is None:
        raise OSError("Unsupported screenshot format")
    return image.convert("RGB")


def _create_diff_png(expected: Image.Image, actual: Image.Image) -> bytes:
    exp_w, exp_h = expected.size
    act_w, act_h = actual.size
    width = max(exp_w, act_w)
    height = max(exp_h, act_h)
    exp = expected.load()
    act = actual.load()
    diff = Image.new("RGB", (width, height), _SIZE_MISMATCH)
    px = diff.load()
    for y in range(height):
        for x in range(width):
            in_expected = x < exp_w and y < exp_h
            in_actual = x < act_w and y < act_h
            if in_expected and in_actual:
                expected_rgb = exp[x, y]
                if expected_rgb == act[x, y]:
                    px[x, y] = _dim_rgb(expected_rgb)
                else:
                    px[x, y] = _DIFF_HIGHLIGHT
    out = io.BytesIO()
    diff.save(out, format="PNG")
    return out.getvalue()


def _dim_rgb(rgb: tuple[int, int, int]) -> tuple[int, int, int]:
    dim = (rgb[0] + rgb[1] + rgb[2]) // 9
    return dim, dim, dim
