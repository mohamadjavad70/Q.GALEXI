/**
 * Guardian Client — Q.GALEXI ↔ Guardian Bridge
 * -----------------------------------------------
 * Connects the Q.GALEXI Express server to the Guardian
 * FastAPI security service running on http://localhost:8001.
 *
 * Usage:
 *   import { analyzeWithGuardian, guardianMiddleware } from './guardianClient.js';
 *
 * • guardianMiddleware  → Express middleware — wraps every API request
 * • analyzeWithGuardian → direct call (for manual use in routes)
 */

import type { Request, Response, NextFunction } from 'express';

// ── Config ────────────────────────────────────────────────────────────────────

const GUARDIAN_URL = process.env.GUARDIAN_URL ?? 'http://localhost:8001';
const GUARDIAN_TIMEOUT_MS = 1500;   // fail-open: if Guardian is down, continue

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GuardianRequest {
  ip: string;
  request: string;
  timestamp: string;
}

export interface GuardianResponse {
  status: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS';
  risk_score: number;      // 0–100
  action: 'ALLOW' | 'MONITOR' | 'ISOLATE';
  reason: string;
  sandboxed: boolean;
}

// ── Core client ───────────────────────────────────────────────────────────────

/**
 * Send a request snapshot to Guardian for analysis.
 * Returns null if Guardian is unavailable (fail-open policy).
 */
export async function analyzeWithGuardian(
  payload: GuardianRequest,
): Promise<GuardianResponse | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GUARDIAN_TIMEOUT_MS);

  try {
    const res = await fetch(`${GUARDIAN_URL}/analyze-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    return (await res.json()) as GuardianResponse;
  } catch {
    // Guardian offline / timeout → fail-open (don't block valid traffic)
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Retrieve all tracked risk scores from Guardian.
 */
export async function getGuardianScores(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`${GUARDIAN_URL}/scores`, {
      signal: AbortSignal.timeout(GUARDIAN_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json() as { scores: Record<string, number> };
    return data.scores;
  } catch {
    return null;
  }
}

/**
 * Retrieve recent Guardian event logs.
 */
export async function getGuardianLogs(
  ip?: string,
  limit = 50,
): Promise<unknown[] | null> {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (ip) params.set('ip', ip);
    const res = await fetch(`${GUARDIAN_URL}/logs?${params}`, {
      signal: AbortSignal.timeout(GUARDIAN_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json() as { logs: unknown[] };
    return data.logs;
  } catch {
    return null;
  }
}

/**
 * Check if Guardian service is reachable.
 */
export async function isGuardianAlive(): Promise<boolean> {
  try {
    const res = await fetch(`${GUARDIAN_URL}/health`, {
      signal: AbortSignal.timeout(1000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Express middleware ────────────────────────────────────────────────────────

/**
 * guardianMiddleware
 *
 * ● Sends every incoming /api/* request to Guardian for analysis.
 * ● If Guardian is offline → passes through (fail-open).
 * ● If action == ISOLATE → responds with 403.
 * ● If action == MONITOR → logs to console and continues.
 * ● Attaches `req.guardianAssessment` for downstream routes.
 */
export function guardianMiddleware(
  req: Request & { guardianAssessment?: GuardianResponse | null },
  res: Response,
  next: NextFunction,
): void {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
    req.socket.remoteAddress ??
    'unknown';

  const snapshot = JSON.stringify({
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    ua: req.headers['user-agent'] ?? '',
  }).slice(0, 512);

  analyzeWithGuardian({
    ip,
    request: snapshot,
    timestamp: new Date().toISOString(),
  }).then((assessment) => {
    req.guardianAssessment = assessment;

    if (!assessment) {
      // Guardian offline — let through
      return next();
    }

    if (assessment.action === 'ISOLATE') {
      console.warn(
        `[Guardian] BLOCKED ip=${ip} score=${assessment.risk_score} reason="${assessment.reason}"`,
      );
      res.status(403).json({
        error: 'Request blocked by security system',
        code: 'GUARDIAN_ISOLATED',
      });
      return;
    }

    if (assessment.action === 'MONITOR') {
      console.warn(
        `[Guardian] MONITOR ip=${ip} score=${assessment.risk_score} reason="${assessment.reason}"`,
      );
    }

    next();
  }).catch(() => next());   // never block on Guardian errors
}
