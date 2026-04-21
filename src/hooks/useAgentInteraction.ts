// ─── useAgentInteraction — hook تعامل با agent + جایزه توکن ─────────────────
import { useCallback, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export interface InteractionResult {
  success: boolean;
  reward?: number;
  balance?: number;
  error?: string;
}

export function useAgentInteraction(userId?: string) {
  const [lastReward, setLastReward] = useState<number | null>(null);

  /** interaction با agent → دریافت Q Token */
  const interact = useCallback(
    async (agentId: string): Promise<InteractionResult> => {
      const uid = userId ?? `guest-${agentId}`;
      try {
        const res = await fetch(`${API_BASE}/api/token/earn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, action: 'talk_agent' }),
        });
        if (!res.ok) throw new Error('server error');
        const data = await res.json() as { reward: number; balance: number };
        setLastReward(data.reward);
        return { success: true, reward: data.reward, balance: data.balance };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
    [userId],
  );

  /** پاداش حل معما */
  const solvePuzzle = useCallback(
    async (difficulty: number): Promise<InteractionResult> => {
      const uid = userId ?? 'guest';
      const baseReward = Math.min(20 * difficulty, 200);
      try {
        const res = await fetch(`${API_BASE}/api/token/earn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, action: 'solve_puzzle' }),
        });
        if (!res.ok) throw new Error('server error');
        const data = await res.json() as { reward: number; balance: number };
        setLastReward(baseReward);
        return { success: true, reward: data.reward, balance: data.balance };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
    [userId],
  );

  /** دریافت موجودی */
  const getBalance = useCallback(async (): Promise<number> => {
    const uid = userId ?? 'guest';
    try {
      const res = await fetch(`${API_BASE}/api/token/balance/${encodeURIComponent(uid)}`);
      const data = await res.json() as { balance: number };
      return data.balance;
    } catch { return 0; }
  }, [userId]);

  return { interact, solvePuzzle, getBalance, lastReward };
}
