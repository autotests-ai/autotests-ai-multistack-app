# tests-python-yandex_tank

Yandex.Tank **2.0.12** + native **phantom** 0.14 · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 instance / ~30s** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2. Phantom does not keep a VU session — `src/prepare.py` logs in once and stamps `Authorization` into request-style ammo.

```bash
cd tests/python/tests-python-yandex_tank
./run.sh
TANK_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
TANK_PROFILE=load LOAD_VUS=10 LOAD_DURING_SECONDS=60 ./run.sh
# load = phantom rps line(1, N, 10s) const(N, hold) with instances=N, not docker-tank.
```

Stand: `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `TANK_ALLOW_PUBLIC=true`.

phout overlay: `build/tank/phout.log`. HTML: `build/tank/report/` (Yandex.Tank title + this run’s numbers, same `/runs/` path as JMeter/Gatling/k6/Locust). Not Overload / lunapark / DataUploader. Not Telegraf. Locust stays living: [`tests-python-locust`](../tests-python-locust/). JMeter JMX is the **etalon living** cell: [`tests-java-jmeter`](../../java/tests-java-jmeter/). Not CI (`ci.yml` stays the JMeter/Gatling orchestrator). Student emit: `python-yandex_tank` (templates still planned — do not copy this folder).
