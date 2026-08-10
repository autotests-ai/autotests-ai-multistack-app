/**
 * Lead Allure + Sonar quality-gate panels (kit e2e pattern).
 * Sonar uses SSOT fixture until CI attaches sonar-gate-wait JSON.
 */
import { panels } from "@qa-guru/allure-report-kit";
import { sonarProjectStatusToQualityGateOptions } from "@qa-guru/allure-report-kit/runtime";

import {
  QUALITY_GATE_LABELS,
  REPORT_LANGUAGE,
  SONAR_QUALITY_GATE_FIXTURE,
  SONAR_QUALITY_GATE_LABELS,
  SONAR_QUALITY_GATE_PROFILE_CONDITIONS,
  SONAR_QUALITY_GATE_SOURCE,
  TITLES,
} from "./constants.mjs";

/**
 * @param {{ layout?: string }} [options]
 * @returns {import("@qa-guru/allure-report-kit").KitCustomPanel[]}
 */
export function buildQualityGatePanels({ layout = "2x1" } = {}) {
  const sonarData = sonarProjectStatusToQualityGateOptions(SONAR_QUALITY_GATE_FIXTURE, {
    lang: REPORT_LANGUAGE,
    profile: SONAR_QUALITY_GATE_SOURCE.profile,
    profileConditions: SONAR_QUALITY_GATE_PROFILE_CONDITIONS.map((row) => ({ ...row })),
    source: { ...SONAR_QUALITY_GATE_SOURCE },
    labels: SONAR_QUALITY_GATE_LABELS,
    barTitle: TITLES.sonarQualityGate,
  });

  return [
    panels.qualityGate({
      id: "allureQualityGate",
      title: TITLES.qualityGate,
      layout,
      labels: QUALITY_GATE_LABELS,
    }),
    panels.custom({
      id: "sonarQualityGate",
      title: TITLES.sonarQualityGate,
      kind: "qualityGate",
      dots: false,
      layout,
      data: sonarData,
    }),
  ];
}
