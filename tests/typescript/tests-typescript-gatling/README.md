# tests-typescript-gatling

Gatling **TypeScript SDK** (`@gatling.io`, `*.gatling.ts`, not tsc → JS, not k6) · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 VU** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2. The CLI (`3.15.105`) compiles `src/*.gatling.ts` onto the same Gatling JVM engine as the Java / JS SDKs — HTML and binary `simulation.log` stay under `build/reports/gatling/`. `jsonPath` comes from `@gatling.io/core`.

```bash
cd tests/typescript/tests-typescript-gatling
npm ci
./run.sh
GATLING_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
GATLING_PROFILE=load GATLING_USERS=10 GATLING_DURING_SECONDS=60 ./run.sh
# load = N concurrent (closed injectClosed), not 10 users fired once.
```

Stand: `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `GATLING_ALLOW_PUBLIC=true`.

Injector Node is **26** (apt NodeSource `node_26.x`, not 22, not 24, not nvm). Same runtime as the JS SDK — not a second install.

Report: `build/reports/gatling/` (same overlay `load_injector_*` as JVM / JS Gatling). JavaScript sibling stays living: [`tests-javascript-gatling`](../../javascript/tests-javascript-gatling/). Java DSL sibling: [`tests-java-gatling`](../../java/tests-java-gatling/). JMeter JMX is the **etalon living** cell: [`tests-java-jmeter`](../../java/tests-java-jmeter/). Not CI (`ci.yml` stays the JMeter/Gatling JVM orchestrator). Student emit: `typescript-gatling` (templates still planned — do not copy this folder).
