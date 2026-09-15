# tests-rust-goose

Official **tag1consulting/goose** 0.18 (Rust, closed VU, not wrk, not vegeta) · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 user / ~30s** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2. Load is **closed** 10 VU, hatch 10s, hold 60s (Goose `--test-plan`, not open rps).

```bash
cd tests/rust/tests-rust-goose
./run.sh
GOOSE_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
GOOSE_PROFILE=load LOAD_VUS=10 LOAD_RAMP_SECONDS=10 LOAD_DURING_SECONDS=60 ./run.sh
# load = Goose test-plan 10,10s;10,60s (closed), not wrk, not vegeta, not open arrivalRate.
```

Stand: `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `GOOSE_ALLOW_PUBLIC=true` **only** for [load.autotests.ai](https://load.autotests.ai/). Not [autotests.ai](https://autotests.ai/), not Box2.

JSONL overlay: `build/goose/results.json` (vegeta-compatible `{timestamp, latency, code}`, streamed during the run). HTML: `build/goose/report/` (Goose title + this run’s numbers, same `/runs/` path as JMeter/Gatling/k6/Locust/Tank/Vegeta/Artillery). rust-version **1.88** / edition 2021 (same pin as Axum). Not Docker on the injector. Artillery JS stays living: [`tests-javascript-artillery`](../../javascript/tests-javascript-artillery/). JMeter JMX is the **etalon living** cell: [`tests-java-jmeter`](../../java/tests-java-jmeter/). Not CI (`ci.yml` stays the JMeter/Gatling orchestrator). Student emit: `rust-goose` (templates still planned — do not copy this folder).
