import {
  LAYERS_REQUIRE_ATTACHMENTS,
  LAYERS_REQUIRE_STEPS,
} from "./quality-gate-custom.mjs";

/** Ethalon quality gate rules (implementations in quality-gate-use.mjs). */
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
