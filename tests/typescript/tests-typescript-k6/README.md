# tests-typescript-k6

Grafana k6 **TypeScript** (native since k6 0.57 / 1.0; injector 2.2.0) · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 VU / 1 iteration** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2. k6 runs `src/*.ts` directly — not `tsc` → JS, not xk6.

```bash
cd tests/typescript/tests-typescript-k6
./run.sh
K6_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
K6_PROFILE=load LOAD_VUS=10 LOAD_DURING_SECONDS=60 ./run.sh
# load = N concurrent (closed ramping-vus), not 10 users fired once.
# Do not set K6_VUS / K6_DURATION — those override the script scenarios.
```

Stand: `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `K6_ALLOW_PUBLIC=true`.

JSON overlay: `build/k6/results.json` (same `load_injector_*` as JavaScript k6). HTML: `build/k6/report/` (k6 web dashboard export, same `/runs/` path as JMeter/Gatling). JavaScript sibling stays living: [`tests-javascript-k6`](../../javascript/tests-javascript-k6/). JS Gatling sibling: [`tests-javascript-gatling`](../../javascript/tests-javascript-gatling/). TS Gatling sibling: [`tests-typescript-gatling`](../tests-typescript-gatling/). JMeter JMX is the **etalon living** cell: [`tests-java-jmeter`](../../java/tests-java-jmeter/). Not CI (`ci.yml` stays the JMeter/Gatling orchestrator). Student emit: `typescript-k6` (templates still planned — do not copy this folder).
