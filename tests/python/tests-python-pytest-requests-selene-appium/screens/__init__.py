from appium.webdriver.common.appiumby import AppiumBy


def by_id(test_id: str) -> tuple[str, str]:
    """Compose testTag → accessibility id (same string as web data-testid)."""
    return AppiumBy.ACCESSIBILITY_ID, test_id
