import {
  LAYERS_REQUIRE_ATTACHMENTS,
  LAYERS_REQUIRE_STEPS,
} from "./quality-gate-custom.mjs";

/**
 * Ethalon quality gate rules (implementations in quality-gate-use.mjs).
 *
 * `maxCiJobFailures` is not evaluated by kit `evaluateQualityGate` (that path
 * only sees Allure results — donut / tests table stay green). After generate,
 * `attach-ci-jobs-quality-gate.mjs` folds GitHub `failure` of layer jobs into
 * the QG widget. Expected `skipped` does not fail the gate.
 */
export const qualityGateRules = [
  {
    id: "failures",
    maxFailures: 0,
    fastFail: true,
  },
  {
    id: "ciJobs",
    maxCiJobFailures: 0,
  },
  {
    id: "reporting",
    minStepsForLayers: LAYERS_REQUIRE_STEPS,
    minAttachmentsForLayers: LAYERS_REQUIRE_ATTACHMENTS,
  },
];
