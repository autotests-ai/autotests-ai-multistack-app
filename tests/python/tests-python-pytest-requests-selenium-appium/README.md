# tests-python-pytest-requests-selenium-appium

Native e2e (pytest · Appium-Python-Client / Selenium · requests · allure-pytest).
The same 21 scenarios, hosts and Allure artifacts as the Java Appium cells
([`tests-java-junit5-rest_assured-selenide-appium`](../../java/tests-java-junit5-rest_assured-selenide-appium/)),
structure and env config in the style of
[`tests-python-pytest-requests-selenium`](../tests-python-pytest-requests-selenium/).

| Piece | Where |
|---|---|
| Config (env / `.env`) | `config.py` — `STAND` (prod·stage·ci), `DEVICE_HOST`, `PLATFORM`, attach flags |
| Session per host | `drivers.py` — emulator · real · simulator (local Appium), selenoid, browserstack |
| Explicit waits | `screens/base.py` over accessibility ids; screens in `screens/` |
| Throwaway users | `tests/conftest.py` fixtures with API postconditions (`api_client.py`) |
| Allure | `attachments.py` + `conftest.py`: failure screenshot, `ATTACH_LAST_SCREENSHOT`, `ATTACH_PAGE_SOURCE`, `ATTACH_DRIVER_LOGS`, `ATTACH_VIDEO` (local recording, Selenoid mp4, BrowserStack artifacts) |

```bash
cd tests/python/tests-python-pytest-requests-selenium-appium
python3.14 -m venv .venv && .venv/bin/pip install -r requirements.txt

DEVICE_HOST=selenoid .venv/bin/pytest -n 3      # Selenoid farm, pool 3 (CPU ceiling — do not raise)
DEVICE_HOST=emulator .venv/bin/pytest           # local Appium, sequential
DEVICE_HOST=browserstack .venv/bin/pytest -n 4  # BROWSERSTACK_* env
PLATFORM=ios DEVICE_HOST=simulator .venv/bin/pytest -m smoke
```

`drivers.py` subclasses `AppiumConnection` (private `_get_connection_manager`: 300 s timeout + TCP keepalive for the ~70 s `POST /session`), so `Appium-Python-Client==6.0.7` / `selenium==4.50.0` are pinned per [`language-toolchain.md`](../../../../../../docs/rag/config/language-toolchain.md) — bump only after re-checking that override.

No retries, no skips. `STAND=ci` is laptop compose — farms cannot reach it.
The farm installs the GitHub Release APK (`ANDROID_APP_URL`), not a local build.
