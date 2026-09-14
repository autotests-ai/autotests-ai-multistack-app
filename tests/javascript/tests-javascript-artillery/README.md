# tests-javascript-artillery

Official **artillery.io 2.0.34** JavaScript (YAML + `processor.js`, not k6, not Gatling JS) · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 rps / ~25s** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2. Load is **open** `arrivalRate` (not closed 10 VU).

```bash
cd tests/javascript/tests-javascript-artillery
./run.sh
ARTILLERY_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
ARTILLERY_PROFILE=load LOAD_RPS=10 LOAD_DURING_SECONDS=60 ./run.sh
# load = artillery arrivalRate=10 for 60s (open), not closed 10 VU, not k6, not Gatling JS.
```

Stand: `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `ARTILLERY_ALLOW_PUBLIC=true`.

JSONL overlay: `build/artillery/results.json` (vegeta-compatible `{timestamp, latency, code}`, streamed during the run). HTML: `build/artillery/report/` (Artillery title + this run’s numbers, same `/runs/` path as JMeter/Gatling/k6/Locust/Tank/Vegeta). TypeScript sibling: [`tests-typescript-artillery`](../../typescript/tests-typescript-artillery/). k6 JS stays living: [`tests-javascript-k6`](../tests-javascript-k6/). JMeter JMX is the **etalon living** cell: [`tests-java-jmeter`](../../java/tests-java-jmeter/). Not CI (`ci.yml` stays the JMeter/Gatling orchestrator). Student emit: `javascript-artillery` (templates still planned — do not copy this folder).
