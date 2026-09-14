# tests-scala-gatling

Gradle · Gatling **Scala DSL** · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 VU** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2.

```bash
cd tests/scala/tests-scala-gatling
./gradlew gatlingRun
./gradlew gatlingRun -DapiBaseUrl=http://localhost:8800 -Dgatling.profile=smoke
./gradlew gatlingRun -Dgatling.profile=load -Dgatling.users=10 -Dgatling.duringSeconds=60
# load = N concurrent (closed), not 10 users fired once.
```

Stand: `apiBaseUrl` / `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`.

Isolated public SUT (Grafana VM, not shared prod): `-Dgatling.allowPublic=true`.

Report: `build/reports/gatling/`. JMeter JMX is the **etalon living** cell: [`tests-java-jmeter`](../../java/tests-java-jmeter/). Java DSL sibling: [`tests-java-gatling`](../../java/tests-java-gatling/). Kotlin DSL sibling: [`tests-kotlin-gatling`](../../kotlin/tests-kotlin-gatling/). JavaScript SDK sibling: [`tests-javascript-gatling`](../../javascript/tests-javascript-gatling/). TypeScript SDK sibling: [`tests-typescript-gatling`](../../typescript/tests-typescript-gatling/). Teaching job is `load-tests` (`LOAD_LANG: scala`, `LOAD_TOOL: gatling`) — not a `gatling-*` box. Student emit: `scala-gatling` (templates still planned — do not copy this folder).
