# tests-java-gatling

Gradle · Gatling **Java DSL** · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 VU** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2.

```bash
cd tests/java/tests-java-gatling
./gradlew gatlingRun
./gradlew gatlingRun -DapiBaseUrl=http://localhost:8800 -Dgatling.profile=smoke
./gradlew gatlingRun -Dgatling.profile=load -Dgatling.users=10 -Dgatling.duringSeconds=30
```

Stand: `apiBaseUrl` / `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`.

Isolated public SUT (Grafana VM, not shared prod): `-Dgatling.allowPublic=true`.

Report: `build/reports/gatling/`. Sibling JMeter JMX stays [`tests-java-jmeter`](../tests-java-jmeter/) (still a slot). Student emit: `java-gatling` (templates still planned — do not copy this folder).
