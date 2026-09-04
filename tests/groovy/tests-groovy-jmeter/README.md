# tests-groovy-jmeter

Gradle · Apache JMeter **JSR223 Groovy** · `layers: [performance]` (not pyramid `@Layer`). Not Allure / Sonar.

Smoke is **1 thread / 1 loop** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2.

Source of truth is Groovy on disk (`src/jmeter/scripts/`) wired from JMX via JSR223 filename. HTTP samplers stay stock JMeter; assertions and token extract are Groovy. The JMX etalon stays [`tests-java-jmeter`](../../java/tests-java-jmeter/). Kotlin TreeBuilder stays [`tests-kotlin-jmeter`](../../kotlin/tests-kotlin-jmeter/). Not Nashorn / Graal / Jython.

```bash
cd tests/groovy/tests-groovy-jmeter
./gradlew jmeterSmoke
./gradlew jmeterSmoke -DapiBaseUrl=http://localhost:8800
./gradlew jmeter -Dthreads=10 -Dloops=-1 -Dduration=30
```

Stand: `apiBaseUrl` / `API_BASE_URL` → local Java API on port 8800 (compose `backend-java-spring`), health [`/api/health`](http://localhost:8800/api/health). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `-Djmeter.allowPublic=true` or `JMETER_ALLOW_PUBLIC=true`.

Results: `build/jmeter/results.jtl` · HTML `build/jmeter/report/`. Student emit: `groovy-jmeter` (templates still planned — do not copy this folder).
