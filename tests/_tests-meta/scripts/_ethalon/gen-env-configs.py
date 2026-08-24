#!/usr/bin/env python
"""Generate {stand-base}_{layer} env profiles — ethalon SSOT (multistack stands)."""

from __future__ import annotations

from pathlib import Path

CONFIG_DIR = Path(__file__).resolve().parents[2] / "src/test/resources/config"
LAYERS = ("unit", "component", "integration", "api", "e2e", "visual", "manual")
KEEP = frozenset({"default.properties", "_ethalon.properties", "_new.properties", "_modified.properties"})

GRADLE_HINT = {
    "unit": "./gradlew testUnit -Denv={env}",
    "component": "./gradlew testComponent -Denv={env}",
    "integration": "./gradlew testIntegration -Denv={env}",
    "api": "./gradlew testApi -Denv={env}",
    "e2e": "./gradlew testE2e -Denv={env}",
    "visual": "./gradlew testVisual -Denv={env}",
    "manual": "./gradlew testManual -Denv={env}",
}

LAYER_DESC = {
    "unit": "pure Java — helpers/*Test, config/*Test",
    "component": "@Tag(component) — design-system preview on :3000",
    "integration": "@Tag(layout,mount) — mount probes",
    "api": "@Layer(api) @Tag(api) — Rest Assured /api/health|items",
    "e2e": "@Layer(e2e) — smoke via testE2e",
    "visual": "CI slice: @Layer(e2e) + @Tag(visual)",
    "manual": "@Tag(manual) — exploratory stubs",
}

COMMON_BROWSER = {
    "browser": "chrome",
    "browserVersion": "148.0",
    "browserSize": "1920x1280",
    "headless": "true",
    "closeBrowserAfterAll": "true",
    "enableHar": "false",
    "enableVnc": "false",
    "enableVideo": "false",
}

ATTACH_OFF = {
    "attachBrowserConsoleLogs": "false",
    "attachHarLogs": "false",
    "attachLastScreenshot": "false",
    "attachPageSource": "false",
    "attachVideo": "false",
    "enableAllureSelenideListener": "false",
    "enableAllureRestAssuredListener": "false",
    "allureRestAssuredListenerStyle": "default",
}

STANDS = {
    "ci": {
        "baseUrl": "http://localhost:8080/",
        "apiBaseUrl": "http://localhost:8080/",
        "remoteUrl": "",
        "videoFolder": "",
        "logToConsole": "true",
        "selenideLogToConsole": "true",
        "rootLogLevel": "info",
    },
    "prod": {
        "baseUrl": "https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/",
        "apiBaseUrl": "https://autotests.ai/stack/backend-java-spring/",
        "remoteUrl": "https://qa_engineer:aAb_-4gs53FD@selenoid.qa.guru/wd/hub",
        "videoFolder": "https://selenoid.qa.guru/video/",
        "browserSize": "1740x1080",
        "logToConsole": "false",
        "selenideLogToConsole": "false",
        "rootLogLevel": "warn",
    },
}

COMPONENT_BASE = {
    "baseUrl": "http://localhost:3000/",
    "apiBaseUrl": "http://localhost:8080/",
}


def layer_overlay(layer: str) -> dict[str, str]:
    if layer == "unit":
        return {
            "allureReportMode": "none",
            "allureAgentMode": "none",
        }
    if layer in ("component", "integration"):
        return {"closeBrowserAfterEach": "true", **ATTACH_OFF}
    if layer == "api":
        return {
            "allureReportMode": "allure3",
            "allureAgentMode": "none",
            **ATTACH_OFF,
            "enableAllureRestAssuredListener": "true",
            "allureRestAssuredListenerStyle": "colored",
        }
    if layer == "e2e":
        return {
            "closeBrowserAfterEach": "true",
            "attachLastScreenshot": "true",
            "attachBrowserConsoleLogs": "false",
            "attachHarLogs": "false",
            "attachPageSource": "false",
            "attachVideo": "false",
            "enableAllureSelenideListener": "false",
        }
    if layer == "visual":
        return {
            "closeBrowserAfterEach": "false",
            "updateBaselines": "false",
            "baselinesDir": "screenshots",
            "visualDiffThreshold": "0.015",
            **ATTACH_OFF,
        }
    if layer == "manual":
        return {
            "closeBrowserAfterEach": "true",
            "headless": "false",
            "attachLastScreenshot": "true",
            "attachPageSource": "true",
            "enableAllureSelenideListener": "true",
            "attachBrowserConsoleLogs": "false",
            "attachHarLogs": "false",
            "attachVideo": "false",
        }
    raise ValueError(layer)


def format_file(stand: str, layer: str, values: dict[str, str]) -> str:
    env = f"{stand}_{layer}"
    lines = [
        f"# {stand} — {layer} ({LAYER_DESC[layer]})",
        f"# {GRADLE_HINT[layer].format(stand=stand, env=env)}",
        "",
    ]
    sections = [
        ("Allure report", ["allureReportMode", "allureAgentMode"]),
        (
            "Allow attachments after each test",
            [
                "attachBrowserConsoleLogs",
                "attachHarLogs",
                "attachLastScreenshot",
                "attachPageSource",
                "attachVideo",
                "enableAllureSelenideListener",
                "enableAllureRestAssuredListener",
                "allureRestAssuredListenerStyle",
            ],
        ),
        ("Target app", ["baseUrl"]),
        ("REST API", ["apiBaseUrl"]),
        ("Selenoid hub", ["hubUrl", "uiUrl", "smokeUrl"]),
        (
            "Browser configuration",
            ["browser", "browserVersion", "browserSize", "headless", "closeBrowserAfterEach", "closeBrowserAfterAll"],
        ),
        (
            "Remote browser hub configuration",
            ["enableHar", "enableVnc", "enableVideo", "videoFolder", "remoteUrl"],
        ),
        ("Visual baselines", ["updateBaselines", "baselinesDir", "visualDiffThreshold"]),
        ("Console log", ["logToConsole", "selenideLogToConsole", "rootLogLevel"]),
    ]
    for title, keys in sections:
        block = [values[k] for k in keys if k in values]
        if not block:
            continue
        if title == "Allow attachments after each test":
            lines.append("# Allow attachments after each test")
        else:
            lines.append(f"# {title}")
        for key in keys:
            if key not in values:
                continue
            if key == "enableAllureSelenideListener":
                lines.append("# Allow allure steps listener")
            if key == "enableAllureRestAssuredListener":
                lines.append("# Allow REST Assured → Allure HTTP attachments")
            if key == "allureRestAssuredListenerStyle":
                lines.append("# default = stock jar templates; colored = tpl/request.ftl + tpl/response.ftl")
            val = values[key]
            if val == "" and key in ("remoteUrl", "videoFolder", "baseUrl", "apiBaseUrl"):
                lines.append(f"# {key}=")
            else:
                lines.append(f"{key}={val}")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def build_values(stand: str, layer: str) -> dict[str, str]:
    values = {**COMMON_BROWSER, **ATTACH_OFF, **STANDS[stand], **layer_overlay(layer)}
    if layer == "component":
        values.update(COMPONENT_BASE)
    if layer == "unit":
        values["allureReportMode"] = "none"
    return values


def main() -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    for path in CONFIG_DIR.glob("*.properties"):
        if path.name not in KEEP:
            path.unlink()
    for stand in STANDS:
        for layer in LAYERS:
            name = f"{stand}_{layer}.properties"
            (CONFIG_DIR / name).write_text(format_file(stand, layer, build_values(stand, layer)), encoding="utf-8")
            print(f"wrote {name}")


if __name__ == "__main__":
    main()
