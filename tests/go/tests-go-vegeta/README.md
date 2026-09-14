# tests-go-vegeta

Official **tsenart/vegeta** 12.13 · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 rps / ~25s** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2. Vegeta does not keep a VU session — `src/prepare.py` logs in once and stamps `Authorization` into HTTP targets.

```bash
cd tests/go/tests-go-vegeta
./run.sh
VEGETA_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
VEGETA_PROFILE=load LOAD_VUS=10 LOAD_DURING_SECONDS=60 ./run.sh
# load = vegeta attack -rate=10/s -duration=60s (open), not closed 10 VU, not wrk, not hey.
```

Stand: `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `VEGETA_ALLOW_PUBLIC=true`.

JSONL overlay: `build/vegeta/results.json`. HTML: `build/vegeta/report/` (Vegeta title + this run’s numbers, same `/runs/` path as JMeter/Gatling/k6/Locust/Tank). Not Docker on the injector. Gatling JS/TS stay living: [`tests-javascript-gatling`](../../javascript/tests-javascript-gatling/), [`tests-typescript-gatling`](../../typescript/tests-typescript-gatling/). JMeter JMX is the **etalon living** cell: [`tests-java-jmeter`](../../java/tests-java-jmeter/). Not CI (`ci.yml` stays the JMeter/Gatling orchestrator). Student emit: `go-vegeta` (templates still planned — do not copy this folder).
