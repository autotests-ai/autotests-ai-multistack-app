# tests-java-jmeter

Etalon load cell · Apache JMeter **JMX** · `layers: [performance]` (not pyramid `@Layer`). Not Allure / Sonar.

Smoke is **1 thread / 1 loop** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2.

Sibling Gatling Java DSL stays living: [`tests-java-gatling`](../tests-java-gatling/). Kotlin TreeBuilder sibling stays living: [`tests-kotlin-jmeter`](../../kotlin/tests-kotlin-jmeter/). Groovy JSR223 sibling stays living: [`tests-groovy-jmeter`](../../groovy/tests-groovy-jmeter/). Students open `src/jmeter/auth-api.jmx` in JMeter GUI like the course.

```bash
cd tests/java/tests-java-jmeter
./gradlew jmeterSmoke
./gradlew jmeterSmoke -DapiBaseUrl=http://localhost:8800
./gradlew jmeter -Dthreads=10 -Dloops=-1 -Dduration=30
```

Stand: `apiBaseUrl` / `API_BASE_URL` → local Java API on port 8800 (compose `backend-java-spring`), health [`/api/health`](http://localhost:8800/api/health). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `-Djmeter.allowPublic=true` or `JMETER_ALLOW_PUBLIC=true`.

Results: `build/jmeter/results.jtl` · HTML `build/jmeter/report/`. Student emit: `java-jmeter` (templates still planned — do not copy this folder).
