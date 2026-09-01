# Java cell remote browser. Source from a Gradle step after ARGS=(...).
# Selenide/Selenium → Selenoid WebDriver. Playwright Java → Selenoid Playwright WS
# (not /wd/hub). Empty SELENOID_PLAYWRIGHT_URL → LocalChromePin / CFT (mock, laptop).
if [ -z "${SELENOID_WEBDRIVER_URL:-}" ] && [ -n "${SELENOID_REMOTE_URL:-}" ]; then
  SELENOID_WEBDRIVER_URL="${SELENOID_REMOTE_URL}"
fi
if [ "${TESTS_UI_LIBRARY:-selenide}" = "playwright" ]; then
  if [ -n "${SELENOID_PLAYWRIGHT_URL:-}" ]; then
    ARGS+=(-DremoteUrl="${SELENOID_PLAYWRIGHT_URL}")
  else
    ARGS+=(-DremoteUrl=)
  fi
elif [ -n "${SELENOID_WEBDRIVER_URL:-}" ]; then
  ARGS+=(-DremoteUrl="${SELENOID_WEBDRIVER_URL}")
fi
