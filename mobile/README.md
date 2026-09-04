# Mobile

Native UI by **language** → product module (stack in the name), same shape as `frontend/`,
`backend/` and `tests/`: `{zone}-{language}-{stack}`.

```
mobile/
  kotlin/
    mobile-kotlin-compose/         # Android — Jetpack Compose, APK
  swift/
    mobile-swift-swiftui/          # iOS — SwiftUI, IPA / simulator .app
```

Both cells are the same product as the ten web frontends — login / register / home, minus
the note surface — against the same `/api/auth/*` backend cell. No mock UI, no WebView
wrapper.

## Why a zone and not `frontend/kotlin/`

| | |
|--|--|
| Artifact | app bundle, not a `dist/` behind nginx: no port, no compose service, no vhost, no `/stack/` tile |
| CI | `frontend/.github/actions/*` dispatch on `FRONTEND_LANG` (`typescript` / `javascript`) and **STOP** on anything else |
| Matrix | hub `matrix.yaml` axis `mobile:` — `frontends:` stays the served web axis, ids there all start with `frontend-` |
| Locators | `data-testid` maps to `contentDescription` / `accessibilityIdentifier`, not to a DOM attribute |

## Shared contract

Screens, testids, shell edge and Appium capabilities: [`../_contract/native-shell.md`](../_contract/native-shell.md).
Flow and API stay [`../_contract/flows/login.md`](../_contract/flows/login.md).

The design-system header is markup **plus** `js/header.js`, which a native app cannot load, so
each cell reimplements that chrome (40dp/pt bar, brand `Multistack`, lang + theme toggles,
burger ≤768 / inline nav ≥769) against the same CSS and JS SSOT — never a second copy of the
design-system CSS (monorepo ADR 007).

## Build

```bash
cd kotlin/mobile-kotlin-compose && ./gradlew :app:assembleDebug
cd swift/mobile-swift-swiftui  && scripts/build-sim.sh     # needs full Xcode
```

Appium login lives in [`../tests/java/tests-java-junit5-rest_assured-selenide-appium/`](../tests/java/tests-java-junit5-rest_assured-selenide-appium/) (`./gradlew emulator`).
