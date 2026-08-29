# tests-java-gradle-junit5-allure3-playwright

Gradle · JUnit 5 · Allure 3 · **Playwright for Java** UI school.

Same `data-testid` stems as the TypeScript Playwright living cell. Page objects use `getByTestId` / `Locator`, not Selenide `$`. No Rest Assured — register/delete cleanup is UI. Screenshot PNG compare is not in this school yet (Chromium baselines would be a separate linux SSOT).

```bash
cd tests/java/tests-java-gradle-junit5-allure3-playwright
./gradlew installChromium
./gradlew test -Denv=ci -DincludeTags=infra
./gradlew test -Denv=ci -DincludeTags=e2e
```

Stand: `-Denv=ci` → gateway [http://localhost:9821/](http://localhost:9821/).
