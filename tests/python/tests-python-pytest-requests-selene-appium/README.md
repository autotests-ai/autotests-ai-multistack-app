# tests-python-pytest-requests-selene-appium

Native e2e (pytest · Selene · Appium-Python-Client · requests · allure-pytest).
The same 21 scenarios, hosts, env config and Allure artifacts as
[`tests-python-pytest-requests-selenium-appium`](../tests-python-pytest-requests-selenium-appium/)
— only the screens differ: Selene `browser.element(...)` with `be`/`have`
conditions instead of hand-written `WebDriverWait`.

Session wiring follows Iakiv Kramarenko's QA.GURU mobile lessons
([`yashaka/selene-in-action`, `py06-lesson-mobile-*`](https://github.com/yashaka/selene-in-action/tree/py06-lesson-mobile-2-final)):
the Appium driver goes into `browser.config.driver`, and
`browser.config._wait_decorator = support._logging.wait_with(context=StepContext)`
logs every Selene wait as an Allure step under the screen-level `@allure.step`.

| Piece | Where |
|---|---|
| Config (env / `.env`) | `config.py` — `STAND` (prod·stage·ci), `DEVICE_HOST`, `PLATFORM`, attach flags |
| Session per host | `drivers.py` — emulator · real · simulator (local Appium), selenoid, browserstack |
| Selene session | `conftest.py` — `browser.config.driver`, timeout 30 s, Allure wait steps |
| Screens | `screens/` — `browser.element(by_id(testId))`, accessibility ids |
| Throwaway users | `tests/conftest.py` fixtures with API postconditions (`api_client.py`) |
| Allure | `attachments.py` — failure screenshot, `ATTACH_LAST_SCREENSHOT`, `ATTACH_PAGE_SOURCE`, `ATTACH_DRIVER_LOGS`, `ATTACH_VIDEO` |

```bash
cd tests/python/tests-python-pytest-requests-selene-appium
python3.14 -m venv .venv && .venv/bin/pip install -r requirements.txt

DEVICE_HOST=selenoid .venv/bin/pytest -n 3      # Selenoid farm, pool 3 (CPU ceiling — do not raise)
DEVICE_HOST=emulator .venv/bin/pytest           # local Appium, sequential
DEVICE_HOST=browserstack .venv/bin/pytest -n 4  # BROWSERSTACK_* env
PLATFORM=ios DEVICE_HOST=simulator .venv/bin/pytest -m smoke
```

Each xdist worker is its own process, so the global Selene `browser` is safe
under `-n`. `drivers.py` subclasses `AppiumConnection` (private `_get_connection_manager`: 300 s timeout + TCP keepalive for the ~70 s `POST /session`), so `Appium-Python-Client==6.0.7` / `selenium==4.50.0` are pinned per [`language-toolchain.md`](../../../../../../docs/rag/config/language-toolchain.md) — bump only after re-checking that override.

No retries, no skips. Credentials come only from env — never
commit BrowserStack keys (the lesson repo inlines them; this cell does not).
