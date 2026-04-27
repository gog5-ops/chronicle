import type { APIRequestContext } from "@playwright/test";

const API_URL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3002";

export async function getStats(request: APIRequestContext) {
  const res = await request.get(`${API_URL}/api/stats`);
  if (!res.ok()) throw new Error(`stats: HTTP ${res.status()}`);
  return res.json() as Promise<{
    totalEntries: number;
    entriesThisMonth: number;
    uniqueActors: number;
    actors: string[];
    currentMonth: string;
  }>;
}

export async function getChronicle(
  request: APIRequestContext,
  query: Record<string, string> = {},
) {
  const params = new URLSearchParams(query).toString();
  const url = `${API_URL}/api/chronicle${params ? `?${params}` : ""}`;
  const res = await request.get(url);
  if (!res.ok()) throw new Error(`chronicle: HTTP ${res.status()}`);
  return res.json() as Promise<{
    entries: Array<{ id: string; date: string; actor: string; issue?: string }>;
    count: number;
  }>;
}

export async function getWorkers(request: APIRequestContext) {
  const res = await request.get(`${API_URL}/api/workers`);
  if (!res.ok()) throw new Error(`workers: HTTP ${res.status()}`);
  return res.json() as Promise<{
    workers: Array<{
      name: string;
      description: string;
      schedule: string;
      status: string;
    }>;
    count: number;
  }>;
}

export async function getAudit(request: APIRequestContext) {
  const res = await request.get(`${API_URL}/api/audit`);
  if (!res.ok()) throw new Error(`audit: HTTP ${res.status()}`);
  return res.json() as Promise<{
    reports: Array<{ id: string; findingCount: number }>;
    count: number;
  }>;
}
