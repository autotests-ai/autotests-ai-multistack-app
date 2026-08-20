# Tests CI verbs

`ci.yml` calls `./tests/.github/actions/<verb>` with
`module_dir: ${{ format('tests/{0}/tests-{0}-{1}-{2}-{3}-{4}', env.TESTS_LANG, env.TESTS_BUILDER, env.TESTS_FRAMEWORK, env.TESTS_REPORT, env.TESTS_UI_LIBRARY) }}`.

GitHub does not interpolate `uses:`. Adapter `uses:` must match that path
(today `./tests/java/tests-java-gradle-junit5-allure3-selenide/.github/actions/<verb>`).
