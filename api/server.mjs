/**
 * Q Planet API — Express backend
 * Handles planet creation, retrieval, and listing.
 *
 * Run: cd api && node server.js
 * Or:  npx ts-node server.ts
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import tokenBridge from './tokenBridge.js';
import { loadAllCivs, upsertCiv, loadCiv, takeSnapshot, saveGlobalMemoryData, loadGlobalMemoryData } from './persistence.js';
import { globalMemory } from './GlobalMemoryMesh.js';
import { canEmit, recordEmission, getEmissionStats } from './economyController.js';
import { evaluateAndApply, getGovernanceStatus, getGovernanceLog } from './governanceEngine.js';
import { postOffer, listOffers, fulfillOffer, cancelOffer, getTradeHistory, getMarketStats } from './agentMarket.js';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:5173',
    'https://qmetaram.com',
  ],
  methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '16kb' }));

// ─── Economy Bridge (Q Token API) ────────────────────────────────────────────
app.use('/api', tokenBridge);

// ─── Vote Rate Limiter (3 votes per minute per IP) ──────────────────────────
const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'بیش از حد مجاز رأی دادید، ۱ دقیقه صبر کنید' },
});

// ─── In-memory store (replace with DB in production) ─────────────────────────
interface Planet {
  id: string;
  name: string;
  owner: string;
  type: 'gallery' | 'lab' | 'ai' | 'shop';
  theme: string;
  modules: string[];
  prompt: string;
  createdAt: string;
}

const planets = new Map<string, Planet>();

// ─── Prompt → Planet Config ───────────────────────────────────────────────────
function generateFromPrompt(prompt: string): Pick<Planet, 'type' | 'theme' | 'modules'> {
  const p = prompt.toLowerCase();
  if (p.includes('gallery') || p.includes('گالری') || p.includes('عکس')) {
    return { type: 'gallery', theme: 'dark-nebula', modules: ['images', 'music'] };
  }
  if (p.includes('ai') || p.includes('هوش') || p.includes('chat')) {
    return { type: 'ai', theme: 'neon-grid', modules: ['chat', 'assistant'] };
  }
  if (p.includes('shop') || p.includes('فروش') || p.includes('store')) {
    return { type: 'shop', theme: 'golden', modules: ['products', 'cart'] };
  }
  return { type: 'lab', theme: 'cyan-void', modules: ['editor', 'terminal'] };
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', planets: planets.size });
});

app.post('/planet/create', (req: Request, res: Response) => {
  const { userId, prompt, name } = req.body as {
    userId?: string;
    prompt?: string;
    name?: string;
  };

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'userId required' });
    return;
  }
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'prompt required' });
    return;
  }

  const config = generateFromPrompt(prompt);
  const planet: Planet = {
    id: randomUUID(),
    name: name?.trim() || `Planet-${Date.now()}`,
    owner: userId,
    prompt: prompt.slice(0, 500),
    createdAt: new Date().toISOString(),
    ...config,
  };

  planets.set(planet.id, planet);
  res.status(201).json(planet);
});

app.get('/planet/:id', (req: Request, res: Response) => {
  const planet = planets.get(req.params.id);
  if (!planet) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(planet);
});

app.get('/planets', (_req: Request, res: Response) => {
  res.json(Array.from(planets.values()));
});

app.delete('/planet/:id', (req: Request, res: Response) => {
  const deleted = planets.delete(req.params.id);
  res.json({ deleted });
});

// ─── Live Vote System ─────────────────────────────────────────────────────────
interface VoteStore { blue: number; red: number }
const votes: VoteStore = { blue: 124, red: 87 }; // seeded so first users see non-zero

app.get('/votes', (_req: Request, res: Response) => {
  const total = votes.blue + votes.red || 1;
  res.json({
    blue: votes.blue,
    red: votes.red,
    bluePercent: Math.round((votes.blue / total) * 100),
    redPercent: Math.round((votes.red / total) * 100),
    total,
  });
});

app.post('/vote', voteLimiter, (req: Request, res: Response) => {
  const { choice } = req.body as { choice?: string };
  if (choice === 'blue') { votes.blue++; }
  else if (choice === 'red') { votes.red++; }
  else { res.status(400).json({ error: 'choice must be blue or red' }); return; }
  const total = votes.blue + votes.red;
  res.json({
    blue: votes.blue,
    red: votes.red,
    bluePercent: Math.round((votes.blue / total) * 100),
    redPercent: Math.round((votes.red / total) * 100),
    total,
  });
});

// ─── Token Reward Info ────────────────────────────────────────────────────────
app.get('/token-config', (_req: Request, res: Response) => {
  res.json({
    signupBonus: 10,
    dailyReward: 3,
    dailyRewardUsd: 3,
    referralBonus: 7,
    tokenSymbol: 'Q',
    tokenUsdRate: 1,
  });
});

// ─── Agent Chat ───────────────────────────────────────────────────────────────
const AGENT_REPLIES_FA = [
  'می‌تونم کمکت کنم این سیاره رو طراحی کنی.',
  'ایده‌ات چیه؟ بیا با هم بسازیم.',
  'این سیاره پتانسیل زیادی داره.',
  'برای پیشرفت این دنیا چه برنامه‌ای داری؟',
  'هر چیزی که بخوای بسازی، من اینجام.',
  'سیستم‌های هوش مصنوعی آماده‌ی اتصال هستن.',
  'کهکشان Q منتظر فرمان توئه.',
  'داده‌های جدید در حال پردازش...',
];

app.post('/agent', (req: Request, res: Response) => {
  const { planetId } = req.body as { planetId?: string };
  const planet = planetId ? planets.get(planetId) : undefined;

  let reply: string;
  if (planet) {
    reply = `سیاره «${planet.name}» با تم ${planet.theme} شناخته شده. ${AGENT_REPLIES_FA[Math.floor(Math.random() * AGENT_REPLIES_FA.length)]}`;
  } else {
    reply = AGENT_REPLIES_FA[Math.floor(Math.random() * AGENT_REPLIES_FA.length)];
  }

  // بازگرداندن وضعیت civilization agent به همراه پاسخ
  const civ = planetId ? civs.get(planetId) : undefined;
  const agentState = civ?.agents[0] ? {
    role: civ.agents[0].role,
    memory: civ.agents[0].memory.slice(-5),
    state: civ.agents[0].state,
    personality: civ.agents[0].personality,
  } : undefined;

  res.json({ reply, agentState });
});

// ─── Q Civilization Engine (server-side) ─────────────────────────────────────
type AgentRole = 'creator' | 'trader' | 'explorer' | 'guardian';
type AgentAction = 'explore' | 'create' | 'trade' | 'rest' | 'guard';
type EmotionType = 'positive' | 'neutral' | 'negative';

interface CivMemory { event: string; timestamp: number; emotion: EmotionType }
interface CivAgentPersonality { curiosity: number; aggression: number; creativity: number }
interface CivAgentState { energy: number; knowledge: number }
interface CivAgent {
  id: string; name: string; role: AgentRole;
  personality: CivAgentPersonality; goals: string[];
  memory: CivMemory[]; state: CivAgentState;
}
interface PlanetCiv {
  id: string; agents: CivAgent[]; qTokens: number;
  resources: { matter: number; energy: number }; tick: number; log: string[];
}

const ROLE_PERSONALITY: Record<AgentRole, CivAgentPersonality> = {
  explorer: { curiosity: 0.9, aggression: 0.2, creativity: 0.5 },
  creator:  { curiosity: 0.5, aggression: 0.1, creativity: 0.9 },
  trader:   { curiosity: 0.4, aggression: 0.6, creativity: 0.3 },
  guardian: { curiosity: 0.3, aggression: 0.8, creativity: 0.2 },
};

function makeCivAgent(id: string, name: string, role: AgentRole): CivAgent {
  return { id, name, role, personality: { ...ROLE_PERSONALITY[role] },
    goals: [], memory: [], state: { energy: 100, knowledge: 0 } };
}

function civDecide(agent: CivAgent): AgentAction {
  if (agent.state.energy < 30) return 'rest';
  const { curiosity, creativity, aggression } = agent.personality;
  if (curiosity > 0.7) return 'explore';
  if (creativity > 0.6) return 'create';
  if (aggression > 0.6) return 'guard';
  return 'trade';
}

function civTick(planet: PlanetCiv): void {
  planet.tick++;
  const labels: Record<AgentAction, string> = {
    explore: 'کشف', create: 'ساخت', trade: 'تجارت', rest: 'استراحت', guard: 'نگهبانی'
  };
  for (const agent of planet.agents) {
    const action = civDecide(agent);
    switch (action) {
      case 'explore':  agent.state.knowledge += 1; agent.state.energy = Math.max(0, agent.state.energy - 10); break;
      case 'create':   planet.resources.matter += 2; agent.state.energy = Math.max(0, agent.state.energy - 15); break;
      case 'trade':    planet.qTokens += 1; agent.state.energy = Math.max(0, agent.state.energy - 5); break;
      case 'guard':    agent.state.energy = Math.max(0, agent.state.energy - 8); break;
      case 'rest':     agent.state.energy = Math.min(100, agent.state.energy + 20); break;
    }
    agent.memory.push({ event: `${labels[action]}`, emotion: 'neutral', timestamp: Date.now() });
    if (agent.memory.length > 50) agent.memory.shift();
    planet.log.push(`[T${planet.tick}] ${agent.name} → ${labels[action]}`);
  }
  if (planet.log.length > 20) planet.log.splice(0, planet.log.length - 20);

  // ─── Memory Mesh: هر ۱۰ tick یک snapshot احساسی از سیاره ثبت می‌شود
  if (planet.tick % 10 === 0 && planet.agents.length > 0) {
    const topAgent = planet.agents.reduce(
      (best, a) => a.state.knowledge > best.state.knowledge ? a : best,
      planet.agents[0],
    );
    const emotion = planet.qTokens > 100 ? 'excited'
                  : planet.qTokens > 50  ? 'positive'
                  : 'neutral';
    globalMemory.addMemory({
      type: 'event',
      content: `[T${planet.tick}] ${topAgent.name} برترین موجودیت با دانش ${topAgent.state.knowledge} | Q: ${planet.qTokens}`,
      emotion,
      importance: Math.min(80, 30 + Math.floor(planet.qTokens / 10)),
      planetId: planet.id,
      agentId: topAgent.id,
      connections: [],
    });
  }
}

const civs = new Map<string, PlanetCiv>();

// ─── بارگذاری تمدن‌ها از دیسک در زمان startup ────────────────────────────
try {
  const persisted = loadAllCivs();
  for (const c of persisted) { civs.set(c.id, c as PlanetCiv); }
  if (persisted.length > 0) console.log(`[✨ Q API] Loaded ${persisted.length} civilizations from disk`);
} catch (e) { console.warn('[Q API] Could not load persisted civs:', e); }

// ─── بارگذاری حافظه جهانی از دیسک ───────────────────────────────────────────
try {
  const savedMemories = loadGlobalMemoryData();
  if (savedMemories.length > 0) {
    globalMemory.fromJSON(savedMemories as Parameters<typeof globalMemory.fromJSON>[0]);
  }
} catch (e) { console.warn('[Q API] Could not load global memory:', e); }

// Auto-save memory every 5 minutes
setInterval(() => {
  try { saveGlobalMemoryData(globalMemory.toJSON()); } catch { /* silent */ }
}, 5 * 60_000);

function getOrCreateCiv(planetId: string): PlanetCiv {
  if (civs.has(planetId)) return civs.get(planetId)!;

  // تلاش بارگذاری از دیسک
  const saved = loadCiv(planetId);
  if (saved) { civs.set(planetId, saved as PlanetCiv); return saved as PlanetCiv; }

  const fresh: PlanetCiv = {
    id: planetId,
    agents: (['explorer', 'creator', 'trader'] as AgentRole[]).map((r, i) =>
      makeCivAgent(`${planetId}-a${i}`, { explorer: 'کاشف', creator: 'سازنده', trader: 'بازرگان', guardian: 'نگهبان' }[r]!, r)
    ),
    qTokens: 0, resources: { matter: 10, energy: 100 }, tick: 0, log: [],
  };
  civs.set(planetId, fresh);
  return fresh;
}

// Auto-tick all active civilizations every 5 seconds + auto-save
setInterval(() => {
  for (const civ of civs.values()) {
    civTick(civ);
    // ذخیره‌سازی دایمی بعد از هر tick
    try { upsertCiv(civ); } catch { /* silent fail */ }
  }
}, 5000);

// GET /planet/:id/civ — وضعیت تمدن سیاره
app.get('/planet/:id/civ', (req: Request, res: Response) => {
  const planet = planets.get(req.params.id);
  if (!planet) { res.status(404).json({ error: 'سیاره پیدا نشد' }); return; }
  res.json(getOrCreateCiv(req.params.id));
});

// POST /planet/:id/civ/tick — یک چرخه دستی
app.post('/planet/:id/civ/tick', (req: Request, res: Response) => {
  const planet = planets.get(req.params.id);
  if (!planet) { res.status(404).json({ error: 'سیاره پیدا نشد' }); return; }
  const civ = getOrCreateCiv(req.params.id);
  civTick(civ);
  try { upsertCiv(civ); } catch { /* silent */ }
  res.json(civ);
});

// POST /planet/:id/civ/save — ذخیره‌سازی دستی
app.post('/planet/:id/civ/save', (req: Request, res: Response) => {
  const civ = civs.get(req.params.id);
  if (!civ) { res.status(404).json({ error: 'تمدن پیدا نشد' }); return; }
  upsertCiv(civ);
  res.json({ saved: true, planetId: req.params.id, timestamp: new Date().toISOString() });
});

// GET /snapshot — خروجی تحلیلی کل جهان
app.get('/snapshot', (_req: Request, res: Response) => {
  res.json(takeSnapshot());
});

// ─── Memory Mesh API ──────────────────────────────────────────────────────────
// GET /api/memory/planet/:planetId
app.get('/api/memory/planet/:planetId', (req: Request, res: Response) => {
  const { planetId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const memories = globalMemory.getCollectiveMemory(decodeURIComponent(planetId), limit);
  const trend    = globalMemory.getEmotionalTrend(decodeURIComponent(planetId));
  res.json({ memories, trend, timestamp: Date.now() });
});

// GET /api/memory/agent/:agentId
app.get('/api/memory/agent/:agentId', (req: Request, res: Response) => {
  const { agentId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const memories = globalMemory.getAgentMemory(decodeURIComponent(agentId), limit);
  res.json({ memories });
});

// POST /api/memory/share — ثبت یک خاطره جدید
app.post('/api/memory/share', (req: Request, res: Response) => {
  const { type, content, emotion, importance, planetId, agentId, userId } = req.body as {
    type?: string; content?: string; emotion?: string; importance?: number;
    planetId?: string; agentId?: string; userId?: string;
  };
  const validTypes = ['agent', 'planet', 'user', 'event'] as const;
  if (!content || typeof content !== 'string') { res.status(400).json({ error: 'content required' }); return; }
  const memType = validTypes.includes(type as typeof validTypes[number]) ? type as typeof validTypes[number] : 'event';
  const memoryId = globalMemory.addMemory({
    type: memType,
    content: content.slice(0, 500),
    emotion: emotion ?? 'neutral',
    importance: Math.min(100, Math.max(0, importance ?? 50)),
    planetId, agentId, userId,
    connections: [],
  });
  res.json({ memoryId, timestamp: Date.now() });
});

// GET /api/memory/stats
app.get('/api/memory/stats', (_req: Request, res: Response) => {
  res.json(globalMemory.getStats());
});

// ─── Agent Market API (Faz C) ─────────────────────────────────────────────────
// GET /api/market/offers
app.get('/api/market/offers', (req: Request, res: Response) => {
  const { planetId, offerType, status, agentId } = req.query as Record<string, string | undefined>;
  res.json(listOffers({ planetId, offerType, status, agentId }));
});

// POST /api/market/offers — ارسال پیشنهاد جدید
app.post('/api/market/offers', (req: Request, res: Response) => {
  const { sellerAgentId, sellerPlanetId, offerType, item, priceQ, quantity } = req.body as {
    sellerAgentId?: string; sellerPlanetId?: string; offerType?: string;
    item?: string; priceQ?: number; quantity?: number;
  };
  if (!sellerAgentId || !sellerPlanetId || !item) {
    res.status(400).json({ error: 'sellerAgentId, sellerPlanetId و item الزامی هستند' });
    return;
  }
  const validOfferTypes = ['knowledge', 'resource', 'skill', 'token'] as const;
  if (!validOfferTypes.includes(offerType as typeof validOfferTypes[number])) {
    res.status(400).json({ error: 'offerType نامعتبر است' });
    return;
  }
  try {
    const offer = postOffer(
      sellerAgentId, sellerPlanetId,
      offerType as typeof validOfferTypes[number],
      item, priceQ ?? 1, quantity ?? 1,
    );
    // ثبت در حافظه جمعی
    globalMemory.addMemory({
      type: 'event',
      content: `عرضه: ${item} به قیمت ${priceQ} Q توسط ${sellerAgentId}`,
      emotion: 'positive', importance: 40,
      planetId: sellerPlanetId, agentId: sellerAgentId, connections: [],
    });
    res.status(201).json(offer);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /api/market/offers/:id/fulfill — خرید پیشنهاد
app.post('/api/market/offers/:id/fulfill', (req: Request, res: Response) => {
  const { buyerAgentId, buyerPlanetId } = req.body as {
    buyerAgentId?: string; buyerPlanetId?: string;
  };
  if (!buyerAgentId || !buyerPlanetId) {
    res.status(400).json({ error: 'buyerAgentId و buyerPlanetId الزامی هستند' });
    return;
  }
  const result = fulfillOffer(req.params.id, buyerAgentId, buyerPlanetId);
  if (!result.success) { res.status(400).json({ error: result.error }); return; }
  // ثبت در حافظه جهانی
  globalMemory.addMemory({
    type: 'event',
    content: `تجارت: ${buyerAgentId} از ${req.params.id} خرید کرد`,
    emotion: 'excited', importance: 55,
    planetId: buyerPlanetId, agentId: buyerAgentId, connections: [],
  });
  res.json(result);
});

// DELETE /api/market/offers/:id — لغو پیشنهاد
app.delete('/api/market/offers/:id', (req: Request, res: Response) => {
  const { agentId } = req.body as { agentId?: string };
  if (!agentId) { res.status(400).json({ error: 'agentId الزامی است' }); return; }
  const result = cancelOffer(req.params.id, agentId);
  if (!result.success) { res.status(400).json({ error: result.error }); return; }
  res.json(result);
});

// GET /api/market/trades — تاریخچه معاملات
app.get('/api/market/trades', (req: Request, res: Response) => {
  const agentId = req.query.agentId as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  res.json(getTradeHistory(agentId, limit));
});

// GET /api/market/stats
app.get('/api/market/stats', (_req: Request, res: Response) => {
  res.json(getMarketStats());
});

// ─── Governance & Economy Control API ────────────────────────────────────────
// GET /api/governance/status
app.get('/api/governance/status', (_req: Request, res: Response) => {
  res.json({ ...getGovernanceStatus(), emissionStats: getEmissionStats() });
});

// GET /api/governance/log
app.get('/api/governance/log', (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json(getGovernanceLog(limit));
});

// POST /api/governance/evaluate — ارزیابی دستی وضعیت اقتصاد
app.post('/api/governance/evaluate', (req: Request, res: Response) => {
  const state = req.body as {
    inflation?: number; activityLevel?: number; abuseRate?: number;
    totalSupply?: number; totalBurned?: number;
  };
  const actions = evaluateAndApply({
    inflation:     Math.min(1, Math.max(0, state.inflation     ?? 0)),
    activityLevel: Math.min(1, Math.max(0, state.activityLevel ?? 0.5)),
    abuseRate:     Math.min(1, Math.max(0, state.abuseRate     ?? 0)),
    totalSupply:   state.totalSupply  ?? 0,
    totalBurned:   state.totalBurned  ?? 0,
  });
  res.json({ actions, status: getGovernanceStatus() });
});

// GET /api/economy/stats
app.get('/api/economy/stats', (_req: Request, res: Response) => {
  res.json({ ...getEmissionStats(), governance: getGovernanceStatus() });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Q API] running on http://localhost:${PORT}`);
});

export default app;
