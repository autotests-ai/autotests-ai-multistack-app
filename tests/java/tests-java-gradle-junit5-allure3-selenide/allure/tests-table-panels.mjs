/**
 * Tests table panel (kit `panels.testsTable` pattern).
 */
import { panels } from "@qa-guru/allure-report-kit";

import { TITLES } from "./constants.mjs";
import { TESTS_TABLE_FIXTURE } from "./tests-table-fixture.mjs";

/**
 * @returns {import("@qa-guru/allure-report-kit").KitCustomPanel[]}
 */
export function buildTestsTablePanels() {
  return [
    panels.testsTable({
      id: "testsTable",
      title: TITLES.testsTable,
      layout: "2x2",
      dots: false,
      data: TESTS_TABLE_FIXTURE,
    }),
  ];
}
