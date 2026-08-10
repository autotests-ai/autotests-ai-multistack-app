/**
 * Overview preset — SSOT for the report lead section.
 *
 * Order: Allure + Sonar quality gates, then overview chart quad (indices 2–5).
 * Imported by builders and `validate-allurerc.mjs`.
 */
import { presets } from "@qa-guru/allure-report-kit";

import { PYRAMID_LAYERS, TITLES } from "./constants.mjs";
import { buildQualityGatePanels } from "./quality-gate-panels.mjs";

/** @type {import("@qa-guru/allure-report-kit").OverviewPreset} */
export const OVERVIEW_PRESET = {
  id: "overview",
  qualityGates: [
    { id: "allureQualityGate", layout: "2x1" },
    { id: "sonarQualityGate", layout: "2x1" },
  ],
  tiles: [
    { chart: "currentStatus" },
    { chart: "durationDynamics", limit: 20 },
    { chart: "testingPyramid", layersKey: "pyramidLayers" },
    { chart: "durations", groupBy: "layer" },
  ],
  renderers: {
    currentStatus: "stock",
    durationDynamics: "stock",
    testingPyramid: "svg",
    durations: "stock",
  },
  titles: {
    currentStatus: TITLES.currentStatus,
    durationDynamics: TITLES.durationDynamics,
    testingPyramid: TITLES.testingPyramid,
    durations: TITLES.durationsByLayer,
  },
  pyramidLayers: [...PYRAMID_LAYERS],
};

/**
 * @param {import("@qa-guru/allure-report-kit").FromOverviewOptions} [options]
 */
export function buildOverviewTiles(options = {}) {
  return presets.fromOverview({
    preset: OVERVIEW_PRESET,
    layers: [...PYRAMID_LAYERS],
    ...options,
  });
}

/**
 * Lead section: quality gates, then overview charts.
 * @param {import("@qa-guru/allure-report-kit").FromOverviewOptions} [options]
 */
export function buildLeadTiles(options = {}) {
  return [...buildQualityGatePanels({ layout: "2x1" }), ...buildOverviewTiles(options)];
}
