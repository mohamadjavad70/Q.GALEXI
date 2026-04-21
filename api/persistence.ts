// ─── Q Planet Persistence — JSON File Store ──────────────────────────────────
// ذخیره‌سازی دائمی سیاره‌ها و تمدن‌ها روی دیسک (بدون native binding)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

interface AgentRecord {
  id: string;
  memory?: unknown[];
  [key: string]: unknown;
}

interface PlanetCivRecord {
  id: string;
  qTokens?: number;
  tick?: number;
  log?: string[];
  agents?: AgentRecord[];
  [key: string]: unknown;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const PLANETS_FILE  = join(DATA_DIR, 'civilizations.json');
const TOKENS_FILE   = join(DATA_DIR, 'token_ledger.json');
const PAYOUTS_FILE  = join(DATA_DIR, 'payout_requests.json');
const MEMORY_FILE   = join(DATA_DIR, 'global_memory.json');

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

// ─── Civilization Store ───────────────────────────────────────────────────────
export function loadAllCivs(): PlanetCivRecord[] {
  ensureDir();
  if (!existsSync(PLANETS_FILE)) return [];
  try { return JSON.parse(readFileSync(PLANETS_FILE, 'utf-8')) as PlanetCivRecord[]; } catch { return []; }
}

function saveAllCivs(civs: PlanetCivRecord[]): void {
  ensureDir();
  writeFileSync(PLANETS_FILE, JSON.stringify(civs, null, 2), 'utf-8');
}

export function loadCiv(planetId: string): PlanetCivRecord | null {
  return loadAllCivs().find((c) => c.id === planetId) ?? null;
}

export function upsertCiv(civ: PlanetCivRecord): void {
  const all = loadAllCivs();
  const idx = all.findIndex((c) => c.id === civ.id);
  // حفظ حافظه: فقط ۳۰ رویداد آخر log و ۲۰ حافظه آخر هر agent
  const slimCiv: PlanetCivRecord = {
    ...civ,
    log: civ.log?.slice(-30) ?? [],
    agents: civ.agents?.map((a) => ({
      ...a,
      memory: (a.memory ?? []).slice(-20),
    })) ?? [],
  };
  if (idx >= 0) all[idx] = slimCiv;
  else all.push(slimCiv);
  saveAllCivs(all);
}

// ─── Token Ledger (Q Token persistent balances) ───────────────────────────────
export function loadBalances(): Record<string, number> {
  ensureDir();
  if (!existsSync(TOKENS_FILE)) return {};
  try { return JSON.parse(readFileSync(TOKENS_FILE, 'utf-8')); } catch { return {}; }
}

export function saveBalances(balances: Record<string, number>): void {
  ensureDir();
  writeFileSync(TOKENS_FILE, JSON.stringify(balances, null, 2), 'utf-8');
}

// ─── Payout Requests ─────────────────────────────────────────────────────────
export interface PayoutRequest {
  id: string;
  userId: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'IRR';
  fiatAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export function loadPayoutRequests(): PayoutRequest[] {
  ensureDir();
  if (!existsSync(PAYOUTS_FILE)) return [];
  try { return JSON.parse(readFileSync(PAYOUTS_FILE, 'utf-8')) as PayoutRequest[]; } catch { return []; }
}

export function savePayoutRequests(requests: PayoutRequest[]): void {
  ensureDir();
  writeFileSync(PAYOUTS_FILE, JSON.stringify(requests, null, 2), 'utf-8');
}

// ─── Global Memory Persistence ────────────────────────────────────────────────
export function saveGlobalMemoryData(nodes: unknown[]): void {
  ensureDir();
  writeFileSync(
    MEMORY_FILE,
    JSON.stringify({ savedAt: new Date().toISOString(), memories: nodes }, null, 2),
    'utf-8',
  );
}

export function loadGlobalMemoryData(): unknown[] {
  ensureDir();
  if (!existsSync(MEMORY_FILE)) return [];
  try {
    const parsed = JSON.parse(readFileSync(MEMORY_FILE, 'utf-8')) as { memories?: unknown[] };
    return Array.isArray(parsed.memories) ? parsed.memories : [];
  } catch { return []; }
}

// ─── Snapshot (full world freeze) ────────────────────────────────────────────
export function takeSnapshot(): object {
  const civs   = loadAllCivs();
  const tokens = loadBalances();
  return {
    timestamp: new Date().toISOString(),
    state: 'snapshot',
    planets: civs.length,
    totalQTokens: civs.reduce((sum, c) => sum + (c.qTokens ?? 0), 0),
    totalAgents:  civs.reduce((sum, c) => sum + (c.agents?.length ?? 0), 0),
    balances: tokens,
    civilizations: civs.map((c) => ({
      id: c.id, qTokens: c.qTokens, tick: c.tick,
      agents: c.agents?.length ?? 0, lastLog: c.log?.at(-1) ?? null,
    })),
  };
}
