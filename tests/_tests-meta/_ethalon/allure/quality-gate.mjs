/**
 * Ethalon quality gate rules for `npx allure quality-gate`.
 *
 * GitHub layer-job `failure` is not an Allure CLI rule: `npx allure quality-gate`
 * has no `use` implementation for it, and kit `evaluateQualityGate` only sees
 * results (donut / tests table stay green). After generate,
 * `attach-ci-jobs-quality-gate.mjs` folds those failures into the QG widget.
 * Expected `skipped` does not fail the gate.
 *
 * Custom reporting keys (`minStepsForLayers`, `minAttachmentsForLayers`) stay in
 * `quality-gate-custom.mjs` / `quality-gate-use.mjs` and are not listed here:
 * Allure errors with Internal Error unless they are also in `qualityGate.use`, and
 * current Rest Assured / Selenide results do not pass those rules.
 */
export const qualityGateRules = [
  {
    id: "failures",
    maxFailures: 0,
    fastFail: true,
  },
];
