import { apiUrl } from './appBase';

/**
 * @typedef {{ status: string, service: string }} HealthResponse
 * @typedef {{ id: number, name: string, description: string }} Item
 * @typedef {{ items: Item[], source?: string }} ItemsResponse
 */

/** @returns {Promise<HealthResponse>} */
export async function fetchHealth() {
  const response = await fetch(apiUrl('/health'));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

/** @returns {Promise<ItemsResponse>} */
export async function fetchItems() {
  const response = await fetch(apiUrl('/items'));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}
