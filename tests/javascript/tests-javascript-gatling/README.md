# tests-javascript-gatling

Gatling **JavaScript SDK** (`@gatling.io`, not Groovy, not k6) · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 VU** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2. The CLI bundles JS onto the same Gatling JVM engine as the Java DSL — HTML and binary `simulation.log` stay under `build/reports/gatling/`.

```bash
cd tests/javascript/tests-javascript-gatling
npm ci
./run.sh
GATLING_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
GATLING_PROFILE=load GATLING_USERS=10 GATLING_DURING_SECONDS=60 ./run.sh
# load = N concurrent (closed), not 10 users fired once.
```

Stand: `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `GATLING_ALLOW_PUBLIC=true`.

Report: `build/reports/gatling/` (same overlay `load_injector_*` as JVM Gatling). TypeScript sibling stays living: [`tests-typescript-gatling`](../../typescript/tests-typescript-gatling/). Java DSL sibling: [`tests-java-gatling`](../../java/tests-java-gatling/). JMeter JMX is the **etalon living** cell: [`tests-java-jmeter`](../../java/tests-java-jmeter/). Not CI (`ci.yml` stays the JMeter/Gatling JVM orchestrator). Student emit: `javascript-gatling` (templates still planned — do not copy this folder).
