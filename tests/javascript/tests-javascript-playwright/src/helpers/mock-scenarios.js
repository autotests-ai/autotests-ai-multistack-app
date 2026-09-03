const { apiRoot } = require('./env');

function admin(path) {
  return `${apiRoot()}${path}`;
}

async function available() {
  try {
    const response = await fetch(admin('/__admin/scenarios'), { signal: AbortSignal.timeout(5000) });
    if (response.status !== 200) {
      return false;
    }
    const type = response.headers.get('content-type') || '';
    return type.includes('json');
  } catch {
    return false;
  }
}

async function setState(scenario, state) {
  const response = await fetch(admin(`/__admin/scenarios/${scenario}/state`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  });
  if (response.status !== 200) {
    throw new Error(`mock scenario ${scenario}=${state}: ${await response.text()}`);
  }
}

async function resetAll() {
  const response = await fetch(admin('/__admin/scenarios/reset'), { method: 'POST' });
  if (response.status !== 200) {
    throw new Error(`mock reset: ${await response.text()}`);
  }
}

module.exports = { available, setState, resetAll };
