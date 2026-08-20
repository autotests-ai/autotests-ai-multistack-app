import {
  LAYERS_REQUIRE_ATTACHMENTS,
  LAYERS_REQUIRE_STEPS,
} from "./quality-gate-custom.mjs";

/**
 * Ethalon quality gate rules (implementations in quality-gate-use.mjs).
 *
 * GitHub layer-job `failure` is not an Allure CLI rule: `npx allure quality-gate`
 * has no `use` implementation for it, and kit `evaluateQualityGate` only sees
 * results (donut / tests table stay green). After generate,
 * `attach-ci-jobs-quality-gate.mjs` folds those failures into the QG widget.
 * Expected `skipped` does not fail the gate.
 */
export const qualityGateRules = [
  {
    id: "failures",
    maxFailures: 0,
    fastFail: true,
  },
  {
    id: "reporting",
    minStepsForLayers: LAYERS_REQUIRE_STEPS,
    minAttachmentsForLayers: LAYERS_REQUIRE_ATTACHMENTS,
  },
];
