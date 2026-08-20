import { apiUrl } from './appBase';
import { getToken } from './auth';

export interface Note {
  id: number;
  title: string;
  text: string;
}

function bearerHeaders(token: string, extra?: HeadersInit): HeadersInit {
  return {
    Authorization: 'Bearer ' + token,
    ...(extra ?? {}),
  };
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return typeof body.message === 'string' ? body.message : fallback;
}

function requireToken(): string {
  const token = getToken();
  if (!token) {
    throw new Error('Missing auth token');
  }
  return token;
}

export async function fetchNote(): Promise<Note | null> {
  const response = await fetch(apiUrl('/note'), {
    headers: bearerHeaders(requireToken()),
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Request failed'));
  }
  return (await response.json()) as Note;
}

export async function putNote(title: string, text: string): Promise<Note> {
  const response = await fetch(apiUrl('/note'), {
    method: 'PUT',
    headers: bearerHeaders(requireToken(), { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title, text }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Request failed'));
  }
  return (await response.json()) as Note;
}

export async function deleteNote(): Promise<void> {
  const response = await fetch(apiUrl('/note'), {
    method: 'DELETE',
    headers: bearerHeaders(requireToken()),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Request failed'));
  }
}
