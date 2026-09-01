# Java cell remote browser. Source from a Gradle step after ARGS=(...).
# Selenide/Selenium → Selenoid WebDriver. Playwright Java → Selenoid Playwright WS
# (not /wd/hub). Empty SELENOID_PLAYWRIGHT_URL → LocalChromePin / CFT (mock, laptop).
if [ -z "${SELENOID_WEBDRIVER_URL:-}" ] && [ -n "${SELENOID_REMOTE_URL:-}" ]; then
  SELENOID_WEBDRIVER_URL="${SELENOID_REMOTE_URL}"
fi
if [ "${TESTS_UI_LIBRARY:-selenide}" = "playwright" ]; then
  # Do not pass the WS URL as -DremoteUrl (query accessKey does not survive Gradle).
  # PlaywrightRuntime reads SELENOID_PLAYWRIGHT_URL / the file below.
  ARGS+=(-DremoteUrl=)
  if [ -n "${SELENOID_PLAYWRIGHT_URL:-}" ]; then
    mkdir -p build
    umask 077
    printf '%s' "${SELENOID_PLAYWRIGHT_URL}" > build/selenoid-playwright.url
    export SELENOID_PLAYWRIGHT_URL_FILE="$(pwd)/build/selenoid-playwright.url"
  fi
elif [ -n "${SELENOID_WEBDRIVER_URL:-}" ]; then
  ARGS+=(-DremoteUrl="${SELENOID_WEBDRIVER_URL}")
fi
