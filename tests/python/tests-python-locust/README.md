# tests-python-locust

Locust **Python** (`locustfile`) · `layers: [performance]` (not pyramid `@Layer`).

Smoke is **1 user / 1 iteration** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2.

```bash
cd tests/python/tests-python-locust
./run.sh
LOCUST_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
LOCUST_PROFILE=load LOAD_VUS=10 LOAD_DURING_SECONDS=60 ./run.sh
# load = N concurrent (closed spawn + hold), not 10 users fired once.
```

Stand: `API_BASE_URL` → [http://localhost:8800](http://localhost:8800/) (compose `backend-java-spring`). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `LOCUST_ALLOW_PUBLIC=true`.

JSON overlay: `build/locust/results.json`. HTML: `build/locust/report/` (Locust `--html`, same `/runs/` path as JMeter/Gatling/k6). Yandex.Tank stays a slot: [`tests-python-yandex_tank`](../tests-python-yandex_tank/). JMeter JMX is the **etalon living** cell: [`tests-java-jmeter`](../../java/tests-java-jmeter/). Not CI (`ci.yml` stays the JMeter/Gatling orchestrator). Student emit: `python-locust` (templates still planned — do not copy this folder).
