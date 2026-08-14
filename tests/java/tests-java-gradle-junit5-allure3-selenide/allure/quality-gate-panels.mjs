/**
 * Lead Allure + Sonar quality-gate overrides for presets.fromLead.
 * Sonar uses SSOT fixture until CI attaches sonar-gate-wait JSON.
 */
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

function buildSonarGateData() {
  return sonarProjectStatusToQualityGateOptions(SONAR_QUALITY_GATE_FIXTURE, {
    lang: REPORT_LANGUAGE,
    profile: SONAR_QUALITY_GATE_SOURCE.profile,
    profileConditions: SONAR_QUALITY_GATE_PROFILE_CONDITIONS.map((row) => ({ ...row })),
    source: { ...SONAR_QUALITY_GATE_SOURCE },
    labels: SONAR_QUALITY_GATE_LABELS,
    barTitle: TITLES.sonarQualityGate,
  });
}

/**
 * @param {{ layout?: string }} [options]
 * @returns {NonNullable<import("@qa-guru/allure-report-kit").FromLeadOptions["gatePanels"]>}
 */
export function buildGatePanels({ layout = "2x1" } = {}) {
  return {
    allureQualityGate: {
      title: TITLES.qualityGate,
      layout,
      labels: QUALITY_GATE_LABELS,
    },
    sonarQualityGate: {
      title: TITLES.sonarQualityGate,
      layout,
      dots: false,
      data: buildSonarGateData(),
    },
  };
}
