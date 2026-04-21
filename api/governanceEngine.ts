// ─── Governance Engine — Auto self-balancing economy ─────────────────────────
// موتور حاکمیت خودکار: سیستم اقتصاد خودش را تنظیم می‌کند
import { getEmissionStats, setRewardMultiplier, getRewardMultiplier } from './economyController.js';

export interface EconomyState {
  inflation: number;     // 0–1
  activityLevel: number; // 0–1
  abuseRate: number;     // 0–1
  totalSupply: number;
  totalBurned: number;
}

export interface GovernanceAction {
  type: 'REDUCE_REWARD' | 'BOOST_REWARD' | 'LIMIT_EMISSION' | 'EXPAND_EMISSION' | 'FLAG_USERS';
  value?: number;
  reason: string;
  riskLevel: number; // 0–1 — اگر > 0.7 نیاز به تأیید دستی دارد
  timestamp: number;
  applied: boolean;
}

const governanceLog: GovernanceAction[] = [];

// ─── Evaluate & Apply ─────────────────────────────────────────────────────────
export function evaluateAndApply(state: EconomyState): GovernanceAction[] {
  const actions: GovernanceAction[] = [];

  if (state.inflation > 0.2) {
    actions.push({ type: 'REDUCE_REWARD', value: 0.8, reason: 'تورم بالا', riskLevel: 0.3, timestamp: Date.now(), applied: false });
  }
  if (state.abuseRate > 0.1) {
    actions.push({ type: 'FLAG_USERS', reason: 'نرخ سوءاستفاده بالا', riskLevel: 0.5, timestamp: Date.now(), applied: false });
  }
  if (state.activityLevel < 0.3) {
    actions.push({ type: 'BOOST_REWARD', value: 1.1, reason: 'فعالیت پایین', riskLevel: 0.2, timestamp: Date.now(), applied: false });
  }
  const { remaining, cap } = getEmissionStats();
  if (remaining / cap < 0.1) {
    actions.push({ type: 'LIMIT_EMISSION', reason: 'نزدیک سقف روزانه', riskLevel: 0.4, timestamp: Date.now(), applied: false });
  }

  // اعمال اقدامات ایمن
  let mult = getRewardMultiplier();
  for (const a of actions) {
    if (a.riskLevel > 0.7) {
      console.log(`[Governance] High-risk action requires manual approval: ${a.type}`);
      continue;
    }
    if (a.type === 'REDUCE_REWARD' && a.value) mult *= a.value;
    if (a.type === 'BOOST_REWARD' && a.value) mult *= a.value;
    a.applied = true;
  }
  setRewardMultiplier(mult);

  // ثبت در لاگ
  for (const a of actions) {
    governanceLog.push(a);
    if (governanceLog.length > 500) governanceLog.shift();
  }

  return actions;
}

// ─── Status & Log ─────────────────────────────────────────────────────────────
export function getGovernanceStatus(): {
  rewardMultiplier: number;
  logCount: number;
  lastAction: GovernanceAction | null;
  emissionStats: ReturnType<typeof getEmissionStats>;
} {
  return {
    rewardMultiplier: getRewardMultiplier(),
    logCount: governanceLog.length,
    lastAction: governanceLog.at(-1) ?? null,
    emissionStats: getEmissionStats(),
  };
}

export function getGovernanceLog(limit = 50): GovernanceAction[] {
  return governanceLog.slice(-limit);
}
