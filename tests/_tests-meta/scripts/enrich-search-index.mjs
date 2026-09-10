#!/usr/bin/env node
/**
 * Fold pyramid labels into Allure 3 awesome `search-index.json`.
 *
 * Upstream SEARCHABLE_LABELS omit module/layer/language/scope, so
 * `?query=backend-java-spring` is empty until those tokens sit in `labels`.
 * Kit plugin-core does the same at generate time; this script is the CI/gh-pages
 * belt so a live report stays searchable even when the published kit is older.
 *
 * Usage:
 *   node enrich-search-index.mjs --report <allureReportDir> [--results <allure-results>]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const EXTRA_SEARCHABLE_LABELS = ["module", "layer", "language", "scope"];

export const TEACHING_TESTS_MODULE = "tests-java-junit5-rest_assured-selenide";

export function inferPyramidLabels(fullName) {
  const fn = String(fullName || "");
  if (fn.startsWith("dev.multistack.app")) {
    return [
      { name: "module", value: "backend-java-spring" },
      { name: "language", value: "java" },
    ];
  }
  if (fn.startsWith("frontend-typescript-react")) {
    return [
      { name: "module", value: "frontend-typescript-react" },
      { name: "layer", value: "component" },
      { name: "language", value: "typescript" },
    ];
  }
  if (fn.startsWith("tests.api")) {
    return [
      { name: "module", value: TEACHING_TESTS_MODULE },
      { name: "layer", value: "api" },
      { name: "language", value: "java" },
    ];
  }
  if (fn.startsWith("tests.ui")) {
    return [
      { name: "module", value: TEACHING_TESTS_MODULE },
      { name: "layer", value: "ui" },
      { name: "language", value: "java" },
    ];
  }
  if (fn.startsWith("tests.e2e")) {
    return [
      { name: "module", value: TEACHING_TESTS_MODULE },
      { name: "layer", value: "e2e" },
      { name: "language", value: "java" },
    ];
  }
  return [];
}

function extraSearchTokens(labels) {
  return (labels ?? []).flatMap((label) => {
    const name = label?.name;
    const value = typeof label?.value === "string" ? label.value.trim() : "";
    if (!value || !EXTRA_SEARCHABLE_LABELS.includes(name)) {
      return [];
    }
    return [`${name}:${value}`, value];
  });
}

function joinSearchValues(values) {
  const unique = new Set(values.map((value) => value?.trim()).filter(Boolean));
  return unique.size > 0 ? [...unique].join(" ") : undefined;
}

function mergeLabelString(existing, extraTokens) {
  const extraJoined = joinSearchValues(extraTokens);
  if (!extraJoined) {
    return existing;
  }
  if (typeof existing === "string" && existing.trim()) {
    const missing = extraTokens.filter((token) => !existing.includes(token));
    if (missing.length === 0) {
      return existing;
    }
    return `${existing} ${joinSearchValues(missing)}`;
  }
  return extraJoined;
}

function resultIds(result) {
  const ids = [];
  if (result?.id) ids.push(String(result.id));
  if (result?.uuid) ids.push(String(result.uuid).replaceAll("-", ""));
  if (result?.uuid) ids.push(String(result.uuid));
  return ids;
}

function indexTestResults(testResults) {
  const byId = new Map();
  const byHistoryId = new Map();
  for (const result of testResults ?? []) {
    for (const id of resultIds(result)) {
      byId.set(id, result);
    }
    if (result?.historyId) {
      byHistoryId.set(result.historyId, result);
    }
  }
  return { byId, byHistoryId };
}

/**
 * @param {object[]} documents
 * @param {object[]} [testResults]
 * @returns {{ documents: object[], enriched: number }}
 */
export function enrichSearchDocuments(documents, testResults) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return { documents, enriched: 0 };
  }
  const { byId, byHistoryId } = indexTestResults(testResults);
  let enriched = 0;
  const next = documents.map((doc) => {
    const result = byId.get(doc.id) ?? byHistoryId.get(doc.historyId);
    let extra = extraSearchTokens(result?.labels);
    if (extra.length === 0) {
      extra = extraSearchTokens(inferPyramidLabels(doc.fullName));
    }
    if (extra.length === 0) {
      return doc;
    }
    const labels = mergeLabelString(doc.labels, extra);
    if (labels === doc.labels) {
      return doc;
    }
    enriched += 1;
    return { ...doc, labels };
  });
  return { documents: next, enriched };
}

export function findSearchIndexFiles(rootDir) {
  const found = [];
  if (!rootDir || !fs.existsSync(rootDir)) {
    return found;
  }
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name === "search-index.json") {
        found.push(full);
      }
    }
  };
  walk(rootDir);
  return found;
}

function listResultFiles(resultsDir) {
  if (!resultsDir || !fs.existsSync(resultsDir)) {
    return [];
  }
  return fs
    .readdirSync(resultsDir)
    .filter((name) => name.endsWith("-result.json") && !name.includes("-retry-"))
    .map((name) => path.join(resultsDir, name));
}

export function loadTestResults(resultsDir) {
  const results = [];
  for (const filePath of listResultFiles(resultsDir)) {
    try {
      results.push(JSON.parse(fs.readFileSync(filePath, "utf8")));
    } catch {
      continue;
    }
  }
  return results;
}

export function enrichSearchIndexTree(reportDir, resultsDir) {
  const testResults = loadTestResults(resultsDir);
  const files = findSearchIndexFiles(reportDir);
  let filesTouched = 0;
  let docsEnriched = 0;
  for (const filePath of files) {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      continue;
    }
    if (!Array.isArray(parsed)) {
      continue;
    }
    const { documents, enriched } = enrichSearchDocuments(parsed, testResults);
    if (enriched === 0) {
      continue;
    }
    fs.writeFileSync(filePath, JSON.stringify(documents));
    filesTouched += 1;
    docsEnriched += enriched;
  }
  return { files: files.length, filesTouched, docsEnriched, results: testResults.length };
}

function parseArgs(argv) {
  const args = { report: "", results: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--report") {
      args.report = argv[i + 1] ?? "";
      i += 1;
    } else if (token === "--results") {
      args.results = argv[i + 1] ?? "";
      i += 1;
    }
  }
  return args;
}

function isMain() {
  const invoked = process.argv[1] && path.resolve(process.argv[1]);
  return invoked === fileURLToPath(import.meta.url);
}

if (isMain()) {
  const { report, results } = parseArgs(process.argv.slice(2));
  if (!report) {
    console.error("enrich-search-index: --report <dir> is required");
    process.exit(1);
  }
  const summary = enrichSearchIndexTree(path.resolve(report), results ? path.resolve(results) : "");
  console.log(
    `enrich-search-index: files=${summary.files} touched=${summary.filesTouched} docs=${summary.docsEnriched} results=${summary.results}`,
  );
}
