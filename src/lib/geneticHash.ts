/**
 * Genetic Hash Ledger — QMETARAM
 * Client-side action tracking with SHA-256 hashes.
 */

export interface LedgerEntry {
  action: string;
  starSlug: string;
  hash: string;
  timestamp: number;
}

export async function createHash(action: string, slug: string): Promise<string> {
  const timestamp = Date.now();
  const input = `${action}:${slug}:${timestamp}`;
  try {
    const data = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest("SHA-256", data);
    const arr = Array.from(new Uint8Array(buf));
    return arr.map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 12);
  } catch {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = ((h << 5) - h) + input.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(16).padStart(12, "0").substring(0, 12);
  }
}

import { safeGetJSON, safeSetJSON } from "@/lib/safeParse";

export function getLedger(): LedgerEntry[] {
  return safeGetJSON<LedgerEntry[]>("qmetaram-ledger", []);
}

export function addToLedger(entry: LedgerEntry) {
  const ledger = getLedger();
  ledger.push(entry);
  safeSetJSON("qmetaram-ledger", ledger);
}

export function getLatestHash(): string {
  const ledger = getLedger();
  return ledger.length > 0 ? ledger[ledger.length - 1].hash : "";
}

export async function logAction(action: string, slug: string): Promise<string> {
  const hash = await createHash(action, slug);
  addToLedger({ action, starSlug: slug, hash, timestamp: Date.now() });
  return hash;
}
