# Java cell remote browser. Source from a Gradle step after ARGS=(...).
# Selenide/Selenium → Selenoid WebDriver. Playwright Java does not speak /wd/hub
# (SELENOID_PLAYWRIGHT_URL is JS today); empty remoteUrl → LocalChromePin / CFT.
if [ -z "${SELENOID_WEBDRIVER_URL:-}" ] && [ -n "${SELENOID_REMOTE_URL:-}" ]; then
  SELENOID_WEBDRIVER_URL="${SELENOID_REMOTE_URL}"
fi
if [ "${TESTS_UI_LIBRARY:-selenide}" = "playwright" ]; then
  ARGS+=(-DremoteUrl=)
elif [ -n "${SELENOID_WEBDRIVER_URL:-}" ]; then
  ARGS+=(-DremoteUrl="${SELENOID_WEBDRIVER_URL}")
fi
