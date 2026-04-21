// ─── Economy Controller — Emission Cap + Reward Engine + Anti-Abuse ──────────
// کنترل اقتصاد: سقف روزانه توکن، موتور هوشمند پاداش، تشخیص تقلب

const DAILY_EMISSION_CAP = 10_000;
let emittedToday = 0;
let lastResetDate = new Date().toDateString();
let rewardMultiplier = 1.0;

function resetIfNewDay(): void {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    emittedToday = 0;
    lastResetDate = today;
  }
}

// ─── Emission Control ─────────────────────────────────────────────────────────
export function canEmit(amount: number): boolean {
  resetIfNewDay();
  return emittedToday + amount <= DAILY_EMISSION_CAP;
}

export function recordEmission(amount: number): void {
  resetIfNewDay();
  emittedToday += amount;
}

export function getEmissionStats(): { cap: number; emittedToday: number; remaining: number } {
  resetIfNewDay();
  return {
    cap: DAILY_EMISSION_CAP,
    emittedToday,
    remaining: DAILY_EMISSION_CAP - emittedToday,
  };
}

// ─── Reward Engine ────────────────────────────────────────────────────────────
export function calculateReward(
  level: number,
  difficulty: number,
  solveRate: number,
  repeatCount: number,
): number {
  let base = difficulty * 10;
  base *= Math.exp(-level / 50);      // کاهش تدریجی با سطح
  if (repeatCount > 2) base *= 0.5;   // جلوگیری از تکرار
  if (solveRate > 5) base *= 0.3;     // جلوگیری از farming سریع
  base *= rewardMultiplier;            // ضریب governance
  return Math.max(1, Math.floor(base));
}

export function setRewardMultiplier(value: number): void {
  rewardMultiplier = Math.max(0.1, Math.min(5.0, value));
}

export function getRewardMultiplier(): number {
  return rewardMultiplier;
}

// ─── Anti-Abuse ───────────────────────────────────────────────────────────────
export type AbuseResult = 'OK' | 'BOT' | 'FARMING' | 'SUSPICIOUS';

export function detectAbuse(
  solveRate: number,
  repeatPattern: boolean,
  sessionHours: number,
): AbuseResult {
  if (solveRate > 10) return 'BOT';
  if (repeatPattern) return 'FARMING';
  if (sessionHours > 10) return 'SUSPICIOUS';
  return 'OK';
}
