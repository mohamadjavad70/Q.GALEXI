// ─── Q Token Bridge Router ───────────────────────────────────────────────────
// API اقتصادی: mint / spend / balance / transfer / payout / sync توکن Q
import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { loadBalances, saveBalances, loadPayoutRequests, savePayoutRequests } from './persistence.js';

// ─── Supabase sync (اختیاری — فقط اگر متغیرهای محیطی تنظیم شده باشند) ───────
let supabaseSyncEnabled = false;
let supabaseUrl = '';
let supabaseKey = '';

if (process.env.SAMIR_SUPABASE_URL && process.env.SAMIR_SUPABASE_ANON_KEY) {
  supabaseUrl = process.env.SAMIR_SUPABASE_URL;
  supabaseKey = process.env.SAMIR_SUPABASE_ANON_KEY;
  supabaseSyncEnabled = true;
}

async function syncBalanceToSupabase(userId: string, amount: number, reason: string): Promise<void> {
  if (!supabaseSyncEnabled) return;
  try {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    };

    // ثبت تراکنش
    await fetch(`${supabaseUrl}/rest/v1/q_token_transactions`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        user_id: userId,
        amount,
        reason,
        type: 'deposit',
        status: 'confirmed',
        created_at: new Date().toISOString(),
      }),
    });

    // upsert موجودی
    await fetch(`${supabaseUrl}/rest/v1/q_token_balances`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        user_id: userId,
        balance: amount,       // Supabase RPC باید sum کند — این fallback است
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    // non-fatal — local ledger source of truth است
    console.warn('[Q] Supabase sync skipped:', (err as Error).message);
  }
}

const router = Router();

// ─── مینت توکن (پاداش فعالیت) ────────────────────────────────────────────────
router.post('/token/mint', async (req: Request, res: Response) => {
  const { userId, amount, reason } = req.body as {
    userId?: string; amount?: number; reason?: string;
  };

  if (!userId || typeof userId !== 'string' || userId.length > 128) {
    res.status(400).json({ error: 'userId نامعتبر' }); return;
  }
  if (typeof amount !== 'number' || amount <= 0 || amount > 500) {
    res.status(400).json({ error: 'مقدار باید بین ۱ و ۵۰۰ باشد' }); return;
  }

  const balances = loadBalances();
  balances[userId] = (balances[userId] ?? 0) + amount;
  saveBalances(balances);

  const reasonStr = reason ?? 'action';
  void syncBalanceToSupabase(userId, amount, reasonStr);

  res.json({
    success: true,
    balance: balances[userId],
    minted: amount,
    reason: reasonStr,
    supabaseSync: supabaseSyncEnabled,
  });
});

// ─── خرج کردن توکن ───────────────────────────────────────────────────────────
router.post('/token/spend', (req: Request, res: Response) => {
  const { userId, amount, reason } = req.body as {
    userId?: string; amount?: number; reason?: string;
  };

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'userId نامعتبر' }); return;
  }
  if (typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'مقدار نامعتبر' }); return;
  }

  const balances = loadBalances();
  const current  = balances[userId] ?? 0;
  if (current < amount) {
    res.status(400).json({ error: 'موجودی کافی نیست', balance: current }); return;
  }

  balances[userId] = current - amount;
  saveBalances(balances);

  res.json({
    success: true,
    balance: balances[userId],
    spent: amount,
    reason: reason ?? 'purchase',
  });
});

// ─── موجودی ─────────────────────────────────────────────────────────────────
router.get('/token/balance/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const balances = loadBalances();
  res.json({ userId, balance: balances[userId] ?? 0 });
});

// ─── Planet earn actions (reward table) ──────────────────────────────────────
const REWARD_TABLE: Record<string, number> = {
  explore:      2,
  create:       10,
  trade:        5,
  solve_puzzle: 20,
  talk_agent:   1,
  visit_planet: 3,
  daily_login:  3,
  referral:     70,  // 7$ at 10:1 rate
  signup:       10,
};

router.post('/token/earn', async (req: Request, res: Response) => {
  const { userId, action } = req.body as { userId?: string; action?: string };

  if (!userId || !action) {
    res.status(400).json({ error: 'userId و action الزامی هستند' }); return;
  }

  const reward = REWARD_TABLE[action] ?? 1;
  const balances = loadBalances();
  balances[userId] = (balances[userId] ?? 0) + reward;
  saveBalances(balances);

  void syncBalanceToSupabase(userId, reward, action);

  res.json({
    success: true,
    action,
    reward,
    balance: balances[userId],
    supabaseSync: supabaseSyncEnabled,
  });
});

// ─── Leaderboard ─────────────────────────────────────────────────────────────
router.get('/token/leaderboard', (_req: Request, res: Response) => {
  const balances = loadBalances();
  const sorted = Object.entries(balances)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([userId, balance], i) => ({ rank: i + 1, userId, balance }));
  res.json(sorted);
});

// ─── Transfer (user ↔ user بدون Supabase) ────────────────────────────────────
const Q_RATES: Record<string, number> = { USD: 0.05, EUR: 0.046, IRR: 2100 };

router.post('/token/transfer', (req: Request, res: Response) => {
  const { from, to, amount, reason } = req.body as {
    from?: string; to?: string; amount?: number; reason?: string;
  };

  if (!from || typeof from !== 'string' || from.length > 128) {
    res.status(400).json({ error: 'from userId نامعتبر' }); return;
  }
  if (!to || typeof to !== 'string' || to.length > 128) {
    res.status(400).json({ error: 'to userId نامعتبر' }); return;
  }
  if (typeof amount !== 'number' || amount <= 0 || amount > 10_000) {
    res.status(400).json({ error: 'مقدار باید بین ۱ و ۱۰۰۰۰ باشد' }); return;
  }

  const balances = loadBalances();
  const fromBal = balances[from] ?? 0;
  if (fromBal < amount) {
    res.status(400).json({ error: 'موجودی کافی نیست', balance: fromBal }); return;
  }

  balances[from] = fromBal - amount;
  balances[to]   = (balances[to] ?? 0) + amount;
  saveBalances(balances);

  res.json({
    success: true,
    from: { userId: from, balance: balances[from] },
    to:   { userId: to,   balance: balances[to] },
    amount,
    reason: reason ?? 'transfer',
  });
});

// ─── Payout Request (Q → Fiat تبدیل درخواست) ────────────────────────────────
router.post('/token/payout-request', (req: Request, res: Response) => {
  const { userId, amount, currency, reason } = req.body as {
    userId?: string; amount?: number;
    currency?: string; reason?: string;
  };

  if (!userId || typeof userId !== 'string' || userId.length > 128) {
    res.status(400).json({ error: 'userId نامعتبر' }); return;
  }
  if (typeof amount !== 'number' || amount <= 0 || amount > 50_000) {
    res.status(400).json({ error: 'مقدار نامعتبر' }); return;
  }
  const cur = (currency ?? 'USD').toUpperCase();
  if (!['USD', 'EUR', 'IRR'].includes(cur)) {
    res.status(400).json({ error: 'currency باید USD، EUR یا IRR باشد' }); return;
  }

  const balances = loadBalances();
  const bal = balances[userId] ?? 0;
  if (bal < amount) {
    res.status(400).json({ error: 'موجودی کافی نیست', balance: bal }); return;
  }

  // قفل موجودی تا تأیید ادمین
  balances[userId] = bal - amount;
  saveBalances(balances);

  const requests = loadPayoutRequests();
  const newReq = {
    id: randomUUID(),
    userId,
    amount,
    currency: cur as 'USD' | 'EUR' | 'IRR',
    fiatAmount: amount * Q_RATES[cur],
    reason: reason ?? 'payout',
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };
  requests.push(newReq);
  savePayoutRequests(requests);

  res.status(201).json({
    success: true,
    request: newReq,
    remainingBalance: balances[userId],
  });
});

// ─── Payout List (admin) ──────────────────────────────────────────────────────
router.get('/token/payout-requests', (_req: Request, res: Response) => {
  res.json(loadPayoutRequests());
});

router.patch('/token/payout-request/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status?: string };

  if (!['approved', 'rejected'].includes(status ?? '')) {
    res.status(400).json({ error: 'status باید approved یا rejected باشد' }); return;
  }

  const requests = loadPayoutRequests();
  const item = requests.find(r => r.id === id);
  if (!item) { res.status(404).json({ error: 'درخواست یافت نشد' }); return; }

  if (item.status !== 'pending') {
    res.status(409).json({ error: 'درخواست قبلاً پردازش شده' }); return;
  }

  item.status = status as 'approved' | 'rejected';

  // اگر رد شد، موجودی برمی‌گردد
  if (status === 'rejected') {
    const balances = loadBalances();
    balances[item.userId] = (balances[item.userId] ?? 0) + item.amount;
    saveBalances(balances);
  }

  savePayoutRequests(requests);
  res.json({ success: true, request: item });
});

// ─── Q Rates ─────────────────────────────────────────────────────────────────
router.get('/token/rates', (_req: Request, res: Response) => {
  res.json({ rates: Q_RATES, symbol: 'Q', note: 'experimental rates' });
});

export default router;

