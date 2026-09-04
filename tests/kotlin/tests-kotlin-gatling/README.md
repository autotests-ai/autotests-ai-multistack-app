# tests-kotlin-gatling

Gradle · Gatling **Kotlin DSL** · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 VU** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2.

```bash
cd tests/kotlin/tests-kotlin-gatling
./gradlew gatlingRun
./gradlew gatlingRun -DapiBaseUrl=http://localhost:8800 -Dgatling.profile=smoke
./gradlew gatlingRun -Dgatling.profile=load -Dgatling.users=10 -Dgatling.duringSeconds=30
```

Stand: `apiBaseUrl` / `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`.

Isolated public SUT (Grafana VM, not shared prod): `-Dgatling.allowPublic=true`.

Report: `build/reports/gatling/`. JMeter JMX is the **etalon living** cell: [`tests-java-jmeter`](../../java/tests-java-jmeter/). Java DSL sibling: [`tests-java-gatling`](../../java/tests-java-gatling/). Scala / JS / TS SDKs stay slots. This folder stays a living Kotlin DSL sibling (not CI). Student emit: `kotlin-gatling` (templates still planned — do not copy this folder).
