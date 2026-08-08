import { apiUrl } from './appBase';

export async function fetchHealth() {
  const response = await fetch(apiUrl('/health'));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
}

export async function fetchItems() {
  const response = await fetch(apiUrl('/items'));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
}
