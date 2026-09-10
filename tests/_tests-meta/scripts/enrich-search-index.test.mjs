import assert from "node:assert/strict";
import { test } from "node:test";

import {
  TEACHING_TESTS_MODULE,
  enrichSearchDocuments,
  inferPyramidLabels,
} from "./enrich-search-index.mjs";

test("inferPyramidLabels maps teaching fullName prefixes to module ids", () => {
  assert.equal(
    inferPyramidLabels("dev.multistack.app.config.CorsConfigTest.apiCorsChecksOrigin").find(
      (label) => label.name === "module",
    )?.value,
    "backend-java-spring",
  );
  assert.equal(
    inferPyramidLabels("frontend-typescript-react:src/test/HomePage.test.ts").find(
      (label) => label.name === "module",
    )?.value,
    "frontend-typescript-react",
  );
  assert.equal(
    inferPyramidLabels("tests.api.AuthApiTest.login").find((label) => label.name === "module")
      ?.value,
    TEACHING_TESTS_MODULE,
  );
  assert.equal(
    inferPyramidLabels("tests.ui.LoginUiTest.login").find((label) => label.name === "layer")
      ?.value,
    "ui",
  );
  assert.equal(
    inferPyramidLabels("tests.e2e.LoginE2eTest.login").find((label) => label.name === "layer")
      ?.value,
    "e2e",
  );
  assert.deepEqual(inferPyramidLabels("something.else"), []);
});

test("enrichSearchDocuments folds module into labels and is idempotent", () => {
  const docs = [
    {
      id: "tr-1",
      fullName: "dev.multistack.app.config.CorsConfigTest.apiCorsChecksOrigin",
      labels: "owner:stanislav epic:Security",
    },
  ];
  const { documents, enriched } = enrichSearchDocuments(docs, []);
  assert.equal(enriched, 1);
  assert.match(documents[0].labels, /module:backend-java-spring/);
  assert.match(documents[0].labels, /backend-java-spring/);
  const again = enrichSearchDocuments(documents, []);
  assert.equal(again.enriched, 0);
});

test("result labels win over fullName inference", () => {
  const { documents } = enrichSearchDocuments(
    [{ id: "tr-1", fullName: "dev.multistack.app.Foo", labels: "" }],
    [
      {
        id: "tr-1",
        labels: [{ name: "module", value: "backend-kotlin-spring" }],
      },
    ],
  );
  assert.match(documents[0].labels, /module:backend-kotlin-spring/);
  assert.doesNotMatch(documents[0].labels, /backend-java-spring/);
});
