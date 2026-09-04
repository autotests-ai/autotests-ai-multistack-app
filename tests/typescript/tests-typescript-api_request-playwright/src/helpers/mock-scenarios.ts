// @ts-nocheck
import { apiRoot } from './env';

function admin(path) {
  return `${apiRoot()}${path}`;
}

async function available() {
  try {
    const response = await fetch(admin('/__admin/scenarios'), { signal: AbortSignal.timeout(5000) });
    return response.status === 200;
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

export { available, setState, resetAll };
