/** Custom quality gate rules — steps/attachments by @Layer label. */

export const LAYERS_REQUIRE_STEPS = ["api", "integration", "e2e", "manual"];

export const LAYERS_REQUIRE_ATTACHMENTS = ["e2e"];

function countSteps(steps) {
  if (!steps?.length) {
    return 0;
  }
  let total = steps.length;
  for (const step of steps) {
    total += countSteps(step.steps);
  }
  return total;
}

function labelValue(tr, name) {
  return tr.labels?.find((label) => label.name === name)?.value ?? "";
}

function isGoUnit(tr) {
  return labelValue(tr, "framework") === "go";
}

export const minStepsForLayersRule = {
  rule: "minStepsForLayers",
  message: ({ actual, expected }) =>
    `${actual} test(s) in layers [${(expected ?? LAYERS_REQUIRE_STEPS).join(", ")}] have no Allure steps`,
  validate: async ({ trs, expected, state }) => {
    const layers = expected ?? LAYERS_REQUIRE_STEPS;
    const previous = state.getResult() ?? 0;
    let missing = previous;

    for (const tr of trs) {
      if (isGoUnit(tr)) {
        continue;
      }
      const layer = labelValue(tr, "layer");
      if (!layers.includes(layer)) {
        continue;
      }
      if (countSteps(tr.steps) === 0) {
        missing += 1;
      }
    }

    state.setResult(missing);

    return {
      success: missing === 0,
      actual: missing,
    };
  },
};

export const minAttachmentsForLayersRule = {
  rule: "minAttachmentsForLayers",
  message: ({ actual, expected }) =>
    `${actual} test(s) in layers [${(expected ?? LAYERS_REQUIRE_ATTACHMENTS).join(", ")}] have no attachments`,
  validate: async ({ trs, expected, state }) => {
    const layers = expected ?? LAYERS_REQUIRE_ATTACHMENTS;
    const previous = state.getResult() ?? 0;
    let missing = previous;

    for (const tr of trs) {
      if (isGoUnit(tr)) {
        continue;
      }
      const layer = labelValue(tr, "layer");
      if (!layers.includes(layer)) {
        continue;
      }
      const attachmentCount = tr.attachments?.length ?? 0;
      if (attachmentCount === 0) {
        missing += 1;
      }
    }

    state.setResult(missing);

    return {
      success: missing === 0,
      actual: missing,
    };
  },
};
