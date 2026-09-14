# tests-typescript-artillery

Official **artillery.io 2.0.34** TypeScript (native `.ts` via esbuild, not `tsc`, not k6, not Gatling TS) · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 rps / ~25s** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2. Artillery runs `src/*.ts` directly — not `tsc` → JS. Load is **open** `arrivalRate` (not closed 10 VU).

```bash
cd tests/typescript/tests-typescript-artillery
./run.sh
ARTILLERY_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
ARTILLERY_PROFILE=load LOAD_RPS=10 LOAD_DURING_SECONDS=60 ./run.sh
# load = artillery arrivalRate=10 for 60s (open), not closed 10 VU, not k6, not Gatling TS, not tsc.
```

Stand: `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `ARTILLERY_ALLOW_PUBLIC=true`.

JSONL overlay: `build/artillery/results.json` (same `load_injector_*` as JavaScript Artillery; vegeta-compatible `{timestamp, latency, code}`, streamed during the run). HTML: `build/artillery/report/` (Artillery title + this run’s numbers, same `/runs/` path as JMeter/Gatling/k6/Locust/Tank/Vegeta). JavaScript sibling stays living: [`tests-javascript-artillery`](../../javascript/tests-javascript-artillery/). k6 TS stays living: [`tests-typescript-k6`](../tests-typescript-k6/). JMeter JMX is the **etalon living** cell: [`tests-java-jmeter`](../../java/tests-java-jmeter/). Not CI (`ci.yml` stays the JMeter/Gatling orchestrator). Student emit: `typescript-artillery` (templates still planned — do not copy this folder).
