# tests-java-jmeter

Etalon load cell · Apache JMeter **JMX** · `layers: [performance]` (not pyramid `@Layer`). Not Allure / Sonar.

Smoke is **1 thread / 1 loop** against the local Java Spring API. This is not a load against [autotests.ai](https://autotests.ai/) or Box2.

Sibling Gatling Java DSL stays living: [`tests-java-gatling`](../tests-java-gatling/). Kotlin TreeBuilder sibling stays living: [`tests-kotlin-jmeter`](../../kotlin/tests-kotlin-jmeter/). Groovy JSR223 sibling stays living: [`tests-groovy-jmeter`](../../groovy/tests-groovy-jmeter/). Students open `src/jmeter/auth-api.jmx` in JMeter GUI like the course.

```bash
cd tests/java/tests-java-jmeter
./gradlew jmeterSmoke
./gradlew jmeterSmoke -DapiBaseUrl=http://localhost:8800
./gradlew jmeter -Dthreads=10 -Dloops=-1 -Dduration=30
```

Stand: `apiBaseUrl` / `API_BASE_URL` → local Java API on port 8800 (compose `backend-java-spring`), health [`/api/health`](http://localhost:8800/api/health). Seed `user1` / `password1`.

Isolated public SUT (dedicated load VM, not shared prod): `-Djmeter.allowPublic=true` or `JMETER_ALLOW_PUBLIC=true`.

Teaching **ramp** is not CI. Injector is the laptop (or a future `load-injector` VM) — never JMeter on load-sut, never Box2/3. GHA job `load-tests` stays `jmeterSmoke` (1 thread). If the SUT errors, lower `-Dthreads`. Do not retarget Box2. Canon: `projects/infra-home/summaries/selectel/load-sut.md`.

```bash
./gradlew jmeter \
  -Djmeter.allowPublic=true \
  -DapiBaseUrl=https://load.autotests.ai/backend-java-spring \
  -Dthreads=10 -Dramp=10 -Dloops=-1 -Dduration=60
# duration needs ThreadGroup.scheduler as stringProp (boolProp ignores -Jscheduler).
# If a run does not stop: JMeter bin/shutdown.sh (port 4445).
RUN_ID="laptop-$(date -u +%Y%m%dT%H%MZ)"
HTML_DIR=build/jmeter/report INJECTOR=java-jmeter BACKEND=backend-java-spring \
  bash ../../../scripts/publish-load-run-html.sh --run-id "$RUN_ID"
```

Results: `build/jmeter/results.jtl` · HTML `build/jmeter/report/`. Teaching job is `load-tests` (default knobs `LOAD_LANG: java`, `LOAD_TOOL: jmeter`); that job copies the JMeter dashboard to [load.autotests.ai/runs/](https://load.autotests.ai/) (not Allure) and does **not** overwrite board ramp numbers (`PATCH_BOARD=0`). Student emit: `java-jmeter` (templates still planned — do not copy this folder).
