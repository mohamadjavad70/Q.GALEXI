/**
 * Q Network — Simple API Server
 * Express-only (no TypeScript, no build)
 * Port: 3001
 */
const path = require('path');
const express = require(path.join(__dirname, 'node_modules', 'express'));

const app = express();
const PORT = 3001;

app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ─── In-memory state ───────────────────────────────────────────
const memoryNodes = [];
const offers = [];
const trades = [];
let emissionTotal = 0;
let rewardMultiplier = 1.0;

// ─── Memory endpoints ───────────────────────────────────────────
app.get('/api/memory/stats', (req, res) => {
  res.json({
    total: memoryNodes.length,
    status: 'running',
    timestamp: Date.now(),
  });
});

app.get('/api/memory/planet/:id', (req, res) => {
  const nodes = memoryNodes.filter(n => n.planetId === req.params.id);
  res.json({ nodes, emotionalTrend: 'neutral' });
});

app.get('/api/memory/agent/:id', (req, res) => {
  const nodes = memoryNodes.filter(n => n.agentId === req.params.id);
  res.json({ nodes });
});

app.post('/api/memory/share', (req, res) => {
  const node = { id: `mem_${Date.now()}`, ...req.body, timestamp: Date.now() };
  memoryNodes.push(node);
  res.json({ ok: true, id: node.id });
});

app.get('/api/memory/insights', (req, res) => {
  const total = memoryNodes.length;
  const insights = [];
  if (total === 0) {
    insights.push({ type: 'action', message: 'حافظه خالی است — منتظر ورود داده', priority: 'low' });
  } else {
    insights.push({ type: 'trend', message: `${total} گره حافظه ثبت شده`, priority: 'low' });
  }
  res.json({ insights });
});

app.get('/api/memory/health', (req, res) => {
  const score = Math.min(100, memoryNodes.length * 2 + 30);
  const label = score >= 70 ? 'پر رونق' : score >= 40 ? 'متعادل' : 'نیاز به توجه';
  res.json({ score, label, summary: `${memoryNodes.length} گره فعال` });
});

// ─── Economy endpoints ───────────────────────────────────────────
app.get('/api/economy/stats', (req, res) => {
  res.json({
    totalQTokens: 1_000_000,
    emissionToday: emissionTotal,
    dailyCap: 10_000,
    rewardMultiplier,
    message: 'Economy service running',
  });
});

// ─── Governance endpoints ────────────────────────────────────────
app.get('/api/governance/status', (req, res) => {
  res.json({ mode: 'auto', rewardMultiplier, log: [] });
});

app.get('/api/governance/log', (req, res) => {
  res.json({ log: [] });
});

app.post('/api/governance/evaluate', (req, res) => {
  res.json({ applied: false, reason: 'manual evaluate — no state change' });
});

// ─── Q Token Bridge endpoints ─────────────────────────────────────
app.get('/api/q/balance/:address', (req, res) => {
  res.json({ address: req.params.address, balance: 500, currency: 'Q' });
});

app.get('/api/q/rates', (req, res) => {
  res.json({ USD: 0.01, EUR: 0.009, IRR: 420 });
});

app.post('/api/q/transfer', (req, res) => {
  const { from, to, amount } = req.body;
  if (!from || !to || !amount) return res.status(400).json({ error: 'missing fields' });
  emissionTotal += Number(amount);
  res.json({ ok: true, txId: `tx_${Date.now()}`, amount, from, to });
});

app.get('/api/q/payout-requests', (req, res) => {
  res.json({ requests: [] });
});

app.post('/api/q/payout-requests', (req, res) => {
  res.json({ ok: true, id: `payout_${Date.now()}`, status: 'pending' });
});

// ─── Market endpoints ─────────────────────────────────────────────
app.get('/api/market/offers', (req, res) => {
  res.json({ offers: offers.filter(o => o.status === 'open') });
});

app.post('/api/market/offers', (req, res) => {
  const offer = {
    id: `offer_${Date.now()}`,
    ...req.body,
    status: 'open',
    createdAt: Date.now(),
  };
  offers.push(offer);
  res.json({ ok: true, offer });
});

app.post('/api/market/offers/:id/fulfill', (req, res) => {
  const offer = offers.find(o => o.id === req.params.id);
  if (!offer) return res.status(404).json({ error: 'not found' });
  offer.status = 'fulfilled';
  const trade = { id: `trade_${Date.now()}`, offerId: offer.id, ...req.body, timestamp: Date.now() };
  trades.push(trade);
  res.json({ ok: true, trade });
});

app.delete('/api/market/offers/:id', (req, res) => {
  const offer = offers.find(o => o.id === req.params.id);
  if (!offer) return res.status(404).json({ error: 'not found' });
  offer.status = 'cancelled';
  res.json({ ok: true });
});

app.get('/api/market/trades', (req, res) => {
  res.json({ trades });
});

app.get('/api/market/stats', (req, res) => {
  res.json({
    openOffers: offers.filter(o => o.status === 'open').length,
    totalTrades: trades.length,
    volumeQ: trades.reduce((s, t) => s + (t.priceQ || 0), 0),
  });
});

// ─── Civ / Planet endpoints (basic) ──────────────────────────────
const planets = {};

app.get('/api/civ/state', (req, res) => {
  res.json({ planets: Object.values(planets), tick: 0 });
});

// ─── Health check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: memoryNodes.length,
    offers: offers.length,
    trades: trades.length,
    timestamp: new Date().toISOString(),
  });
});

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\u2705 Q Network API running on http://localhost:${PORT}`);
  console.log('Routes: /api/health | /api/memory/* | /api/economy/* | /api/governance/* | /api/market/* | /api/q/*');
});
