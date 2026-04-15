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

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// ─── Security ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:5173',
    'https://qmetaram.com',
  ],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '16kb' }));

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

  res.json({ reply });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Q API] running on http://localhost:${PORT}`);
});

export default app;
