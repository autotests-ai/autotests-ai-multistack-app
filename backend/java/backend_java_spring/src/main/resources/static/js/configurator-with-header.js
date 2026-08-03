import { copyToClipboard } from './dom-utils.js';
import { mountHighlightedOutput } from './code-highlight.js';

const root = document.querySelector('[data-testid="configurator-params"]');
const output = document.getElementById('configurator-output');
const copyBtn = document.getElementById('configurator-copy');
const resetBtn = document.getElementById('configurator-reset');

if (!root || !output) {
  throw new Error('configurator-with-header.js: missing #configurator-params or #configurator-output');
}

const DEFAULTS = {
  buildOs: 'linux',
  buildLanguage: 'java',
  javaVersion: '21',
  buildTool: 'gradle',
  gradleBin: 'gradlew',
  gradleVersion: '9.6.0',
  configStand: 'local_e2e',
  pyramidLayer: 'component',
  testSuite: 'LoginTests',
  testMethod: '',
  allureReportMode: 'allure3',
  allureVersion: '3.13.0',
  allureAgentMode: 'none',
  allureQualityGate: 'false',
  browser: 'chrome',
  browserVersion: '148',
  headless: 'true',
  browserSize: '1920x1280',
  closeBrowserAfterEach: 'true',
  closeBrowserAfterAll: 'true',
  remoteUrl: '',
  enableVnc: 'false',
  enableVideo: 'true',
  enableHar: 'false',
};

/** @type {Record<string, string>} */
const state = { ...DEFAULTS };

const GRADLE_FLAGS = [
  'headless',
  'browser',
  'browserVersion',
  'browserSize',
  'closeBrowserAfterEach',
  'closeBrowserAfterAll',
  'remoteUrl',
  'enableVnc',
  'enableVideo',
  'enableHar',
  'allureReportMode',
  'pyramidLayer',
];

function paramIdFromNode(node) {
  const host = node.closest('[data-param-id]');
  return host ? host.getAttribute('data-param-id') : null;
}

function syncSeg(paramId, value) {
  const host = root.querySelector('[data-param-id="' + paramId + '"]');
  if (!host) {
    return;
  }
  host.querySelectorAll('.plaque-field-seg__btn').forEach(function (btn) {
    const on = btn.dataset.value === value;
    btn.classList.toggle('plaque-field-seg__btn--on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function readSeg(paramId) {
  const host = root.querySelector('[data-param-id="' + paramId + '"]');
  if (!host) {
    return state[paramId];
  }
  const active = host.querySelector('.plaque-field-seg__btn--on');
  return active ? active.dataset.value || state[paramId] : state[paramId];
}

function readControl(paramId) {
  const host = root.querySelector('[data-param-id="' + paramId + '"]');
  if (!host) {
    return state[paramId];
  }
  const control = host.querySelector('.plaque-field__control');
  return control ? control.value : state[paramId];
}

function syncAllFromDom() {
  Object.keys(DEFAULTS).forEach(function (paramId) {
    const host = root.querySelector('[data-param-id="' + paramId + '"]');
    if (!host) {
      return;
    }
    if (host.querySelector('.plaque-field-seg')) {
      state[paramId] = readSeg(paramId);
      return;
    }
    state[paramId] = readControl(paramId);
  });
}

function renderOutput() {
  const bin = state.gradleBin === 'gradlew' ? './gradlew' : 'gradle';
  const lines = [bin + ' clean test -Denv=' + state.configStand];

  GRADLE_FLAGS.forEach(function (key) {
    const value = state[key];
    if (value === '' || value == null) {
      return;
    }
    lines.push('  -D' + key + '=' + value);
  });

  if (state.testMethod) {
    lines.push("  --tests '" + state.testSuite + '.' + state.testMethod + "'");
  } else if (state.testSuite) {
    lines.push("  --tests '" + state.testSuite + "'");
  }

  mountHighlightedOutput(output, lines.join(' \\\n'), 'shell');
}

function setParam(paramId, value) {
  state[paramId] = value;
  if (root.querySelector('[data-param-id="' + paramId + '"] .plaque-field-seg')) {
    syncSeg(paramId, value);
  } else {
    const host = root.querySelector('[data-param-id="' + paramId + '"]');
    const control = host && host.querySelector('.plaque-field__control');
    if (control) {
      control.value = value;
    }
  }
  renderOutput();
}

function resetAll() {
  Object.entries(DEFAULTS).forEach(function ([paramId, value]) {
    setParam(paramId, value);
  });
}

function copyOutput() {
  const text = output.textContent || '';
  if (!text) {
    return;
  }

  void copyToClipboard(text, {
    onSuccess: function () {
      if (!copyBtn) {
        return;
      }
      const prev = copyBtn.getAttribute('title') || 'Копировать';
      copyBtn.setAttribute('title', 'Скопировано');
      setTimeout(function () {
        copyBtn.setAttribute('title', prev);
      }, 2000);
    },
  });
}

root.addEventListener('click', function (event) {
  const btn = event.target.closest('.plaque-field-seg__btn');
  if (!btn || !root.contains(btn)) {
    return;
  }
  const paramId = paramIdFromNode(btn);
  if (!paramId || btn.dataset.value == null) {
    return;
  }
  setParam(paramId, btn.dataset.value);
});

root.addEventListener('change', function (event) {
  const control = event.target.closest('.plaque-field__control');
  if (!control || !root.contains(control)) {
    return;
  }
  const paramId = paramIdFromNode(control);
  if (!paramId) {
    return;
  }
  setParam(paramId, control.value);
});

root.addEventListener('input', function (event) {
  const control = event.target.closest('input.plaque-field__control');
  if (!control || !root.contains(control)) {
    return;
  }
  const paramId = paramIdFromNode(control);
  if (!paramId) {
    return;
  }
  setParam(paramId, control.value);
});

if (copyBtn) {
  copyBtn.addEventListener('click', copyOutput);
}

if (resetBtn) {
  resetBtn.addEventListener('click', resetAll);
}

syncAllFromDom();
renderOutput();
