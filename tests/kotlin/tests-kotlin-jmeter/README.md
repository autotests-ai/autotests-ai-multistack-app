# tests-kotlin-jmeter

Gradle · Apache JMeter **Kotlin TreeBuilder DSL** (5.6+) · `layers: [performance]` (not pyramid `@Layer`). Not Allure / Sonar.

Smoke is **1 thread / 1 loop** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2.

Source of truth is Kotlin (`src/main/kotlin/load/AuthApiPlan.kt`) — Apache JMeter 5.6 [TreeBuilder DSL](https://jmeter.apache.org/usermanual/build-programmatic-test-plan.html) (experimental; GUI **Copy Code**). Not abstracta `jmeter-java-dsl`. `./gradlew writeJmx` materializes JMX for the stock CLI. The JMX etalon stays [`tests-java-jmeter`](../../java/tests-java-jmeter/). Groovy JSR223 stays the slot [`tests-groovy-jmeter`](../../groovy/tests-groovy-jmeter/).

```bash
cd tests/kotlin/tests-kotlin-jmeter
./gradlew jmeterSmoke
./gradlew jmeterSmoke -DapiBaseUrl=http://localhost:8800
./gradlew jmeter -Dthreads=10 -Dloops=-1 -Dduration=30
```

Stand: `apiBaseUrl` / `API_BASE_URL` → local Java API on port 8800 (compose `backend-java-spring`), health [`/api/health`](http://localhost:8800/api/health). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `-Djmeter.allowPublic=true` or `JMETER_ALLOW_PUBLIC=true`.

Results: `build/jmeter/results.jtl` · HTML `build/jmeter/report/`. Student emit: `kotlin-jmeter` (templates still planned — do not copy this folder).
