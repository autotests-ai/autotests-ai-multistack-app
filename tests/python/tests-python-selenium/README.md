# Multistack — tests-python-selenium (Selenium)

UI smoke mirroring Java Selenide stack: fluent page objects, pytest + allure-pytest, `conftest` ≈ `TestBase`.

## Quick start

```bash
cd tests-python-selenium
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env   # BASE_URL=https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/
pytest
```

## Remote (Selenoid WebDriver)

```bash
export BASE_URL=https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/
export REMOTE_URL=https://user1:1234@selenoid.qa.guru/wd/hub
export BROWSER_VERSION=148.0
pytest
```

## Allure

```bash
allure serve allure-results
```

Jenkins freestyle: `autotests-ai-multistack-tests-freestyle-python-allure3`.
