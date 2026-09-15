# tests-csharp-nbomber

Official **PragmaticFlow/NBomber** (C#, closed copies, not open rps, not JMeter) · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 copy / 1 iteration** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2. Load is **closed** 10 copies: `RampingConstant` 10s + `KeepConstant` 60s (not open rps).

```bash
cd tests/csharp/tests-csharp-nbomber
./run.sh
NBOBBER_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
NBOBBER_PROFILE=load LOAD_VUS=10 LOAD_RAMP_SECONDS=10 LOAD_DURING_SECONDS=60 ./run.sh
# load = NBomber RampingConstant 10 + KeepConstant 60s (closed), not open arrivalRate, not JMeter.
```

Stand: `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `NBOBBER_ALLOW_PUBLIC=true` **only** for [load.autotests.ai](https://load.autotests.ai/). Not [autotests.ai](https://autotests.ai/), not Box2.

JSONL overlay: `build/nbomber/results.json` (vegeta-compatible `{timestamp, latency, code}`, streamed during the run). HTML: `build/nbomber/report/` (NBomber title + this run’s numbers, same `/runs/` path as JMeter/Gatling/k6/Locust/Tank/Vegeta/Artillery/Goose). TargetFramework **net8.0** (same pin as ASP.NET). Not Docker / not mono on the injector. Goose stays living: [`tests-rust-goose`](../../rust/tests-rust-goose/). JMeter JMX is the **etalon living** cell: [`tests-java-jmeter`](../../java/tests-java-jmeter/). Not CI (`ci.yml` stays the JMeter/Gatling orchestrator). Student emit: `csharp-nbomber` (templates still planned — do not copy this folder).
