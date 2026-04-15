/**
 * Q Planet API client — used by frontend components
 * Calls the Express backend (or mock if offline).
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export interface Planet {
  id: string;
  name: string;
  owner: string;
  type: 'gallery' | 'lab' | 'ai' | 'shop';
  theme: string;
  modules: string[];
  prompt: string;
  createdAt: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`Q API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function createPlanet(params: {
  userId: string;
  prompt: string;
  name?: string;
}): Promise<Planet> {
  return apiFetch<Planet>('/planet/create', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getPlanet(id: string): Promise<Planet> {
  return apiFetch<Planet>(`/planet/${id}`);
}

export async function listPlanets(): Promise<Planet[]> {
  return apiFetch<Planet[]>('/planets');
}

export async function deletePlanet(id: string): Promise<{ deleted: boolean }> {
  return apiFetch<{ deleted: boolean }>(`/planet/${id}`, { method: 'DELETE' });
}
