# tests-javascript-k6

Grafana k6 **JavaScript** (runtime, not Node) · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 VU / 1 iteration** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2.

```bash
cd tests/javascript/tests-javascript-k6
./run.sh
K6_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
K6_PROFILE=load LOAD_VUS=10 LOAD_DURING_SECONDS=60 ./run.sh
# load = N concurrent (closed ramping-vus), not 10 users fired once.
# Do not set K6_VUS / K6_DURATION — those override the script scenarios.
```

Stand: `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `K6_ALLOW_PUBLIC=true`.

JSON overlay: `build/k6/results.json`. HTML: `build/k6/report/` (k6 web dashboard export, same `/runs/` path as JMeter/Gatling). TypeScript sibling: [`tests-typescript-k6`](../../typescript/tests-typescript-k6/). JS Gatling stays a slot. JMeter JMX is the **etalon living** cell: [`tests-java-jmeter`](../../java/tests-java-jmeter/). Not CI (`ci.yml` stays the JMeter/Gatling orchestrator). Student emit: `javascript-k6` (templates still planned — do not copy this folder).
