# tests-lua-wrk

Official **[wg/wrk](https://github.com/wg/wrk)** (Lua scripts, not wrk2, not `-R`, not Vegeta, not hey) · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 thread / 1 connection / 10s** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2. Load is **wrk -t10 -c10 -d60s**. wrk has no ramp — do not invent one.

```bash
cd tests/lua/tests-lua-wrk
./run.sh
WRK_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
WRK_PROFILE=load WRK_THREADS=10 WRK_CONNECTIONS=10 LOAD_DURING_SECONDS=60 ./run.sh
# load = wrk -t10 -c10 -d60s (no ramp), not wrk2, not -R, not Vegeta, not hey.
```

Stand: `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`. Live check is `GET /api/health` → 200. Root `/` = 401 (Spring Security) is ok. `API_BASE_URL` is the origin without a path.

Isolated public SUT (dedicated load VM, not shared prod): `WRK_ALLOW_PUBLIC=true` **only** for [load.autotests.ai](https://load.autotests.ai/). Not [autotests.ai](https://autotests.ai/), not Box2.

JSONL overlay: `build/wrk/results.json` (vegeta-compatible `{timestamp, latency, code}`, streamed from Lua `response()` during the run, not only `done()`). HTML: `build/wrk/report/` (wrk in the title + this run’s numbers, same `/runs/` path as JMeter/Gatling/k6/Locust/Tank/Vegeta/Artillery/Goose/NBomber). Not Docker on the injector. Artillery / Goose / NBomber stay living. JMeter JMX is the **etalon living** cell: [`tests-java-jmeter`](../../java/tests-java-jmeter/). Not CI (`ci.yml` stays the JMeter/Gatling orchestrator). Student emit: `lua-wrk` (templates still planned — do not copy this folder).
