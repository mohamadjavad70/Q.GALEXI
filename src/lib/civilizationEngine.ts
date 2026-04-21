// ─── Q Civilization Engine (QCE) ─────────────────────────────────────────────
// موتور تمدن: هر tick رفتار agentها → تولید ارزش → اقتصاد emergent

import {
  CivAgent,
  AgentAction,
  AgentRole,
  addMemory,
  decide,
  createAgent,
} from './agentCore';
import { postMarketOffer, getMarketStats } from './AgentMarket';

export interface PlanetResources {
  matter: number;
  energy: number;
}

export interface PlanetCiv {
  id: string;
  agents: CivAgent[];
  qTokens: number;
  resources: PlanetResources;
  tick: number;
  log: string[];  // آخرین ۲۰ رویداد مهم
}

// ─── Factory ──────────────────────────────────────────────────────────────────
const DEFAULT_ROLES: AgentRole[] = ['explorer', 'creator', 'trader'];

export function createPlanetCiv(planetId: string): PlanetCiv {
  return {
    id: planetId,
    agents: DEFAULT_ROLES.map((role, i) =>
      createAgent(`${planetId}-agent-${i}`, roleLabel(role), role)
    ),
    qTokens: 0,
    resources: { matter: 10, energy: 100 },
    tick: 0,
    log: [],
  };
}

function roleLabel(role: AgentRole): string {
  const labels: Record<AgentRole, string> = {
    explorer: 'کاشف',
    creator:  'سازنده',
    trader:   'بازرگان',
    guardian: 'نگهبان',
  };
  return labels[role];
}

// ─── یک چرخه زمانی ────────────────────────────────────────────────────────────
// هر 10 tick: agent تجاری یک پیشنهاد به بازار می‌فرستد
export function tickPlanet(planet: PlanetCiv): void {
  planet.tick++;

  for (const agent of planet.agents) {
    const action: AgentAction = decide(agent);
    applyAction(planet, agent, action);
  }

  // نگه‌داری log (۲۰ رویداد آخر)
  if (planet.log.length > 20) planet.log.splice(0, planet.log.length - 20);

  // ─── Market simulation هر ۱۰ tick ────────────────────────────────────────
  if (planet.tick % 10 === 0) {
    simulateMarketTick(planet);
  }
}

// agentهای trader هر 10 tick یک پیشنهاد به بازار می‌فرستند
function simulateMarketTick(planet: PlanetCiv): void {
  const traders = planet.agents.filter(a => a.role === 'trader');
  for (const trader of traders) {
    if (trader.state.knowledge > 5 && trader.state.energy > 30) {
      const offerTypes = ['knowledge', 'resource', 'skill'] as const;
      const offerType = offerTypes[Math.floor(Math.random() * offerTypes.length)];
      const priceQ = Math.max(1, Math.floor(trader.state.knowledge * 0.5 + Math.random() * 5));
      void postMarketOffer(
        trader.id, planet.id, offerType,
        `${trader.name} ${offerType}`, priceQ, 1,
      ).catch(() => { /* بازار آفلاین — silent */ });
    }
  }
  // لاگ آمار بازار هر ۵۰ tick
  if (planet.tick % 50 === 0) {
    void getMarketStats().then(stats => {
      planet.log.push(`[T${planet.tick}] بازار: ${stats.openOffers} پیشنهاد باز — ${stats.volumeQ.toFixed(0)} Q حجم`);
    }).catch(() => { /* silent */ });
  }
}

function applyAction(planet: PlanetCiv, agent: CivAgent, action: AgentAction): void {
  switch (action) {
    case 'explore':
      agent.state.knowledge += 1;
      agent.state.energy  = Math.max(0, agent.state.energy - 10);
      addMemory(agent, 'منطقه جدیدی کشف شد', 'positive');
      planet.log.push(`[T${planet.tick}] ${agent.name} → کشف (+1 دانش)`);
      break;

    case 'create':
      planet.resources.matter += 2;
      agent.state.energy = Math.max(0, agent.state.energy - 15);
      addMemory(agent, 'ساختار جدیدی ساخته شد', 'positive');
      planet.log.push(`[T${planet.tick}] ${agent.name} → ساخت (+2 ماده)`);
      break;

    case 'trade':
      planet.qTokens += 1;
      agent.state.energy = Math.max(0, agent.state.energy - 5);
      addMemory(agent, 'تراکنش توکن انجام شد', 'neutral');
      planet.log.push(`[T${planet.tick}] ${agent.name} → تجارت (+1 Q)`);
      break;

    case 'guard':
      agent.state.energy = Math.max(0, agent.state.energy - 8);
      addMemory(agent, 'نقطه امنیتی حفظ شد', 'neutral');
      planet.log.push(`[T${planet.tick}] ${agent.name} → نگهبانی`);
      break;

    case 'rest':
      agent.state.energy = Math.min(100, agent.state.energy + 20);
      addMemory(agent, 'استراحت — انرژی بازیابی شد', 'positive');
      planet.log.push(`[T${planet.tick}] ${agent.name} → استراحت (+20 انرژی)`);
      break;
  }
}

// ─── QURE (unified runtime) ───────────────────────────────────────────────────
export class QURE {
  private civs = new Map<string, PlanetCiv>();
  private timer: ReturnType<typeof setInterval> | null = null;

  registerPlanet(planetId: string): PlanetCiv {
    if (!this.civs.has(planetId)) {
      this.civs.set(planetId, createPlanetCiv(planetId));
    }
    return this.civs.get(planetId)!;
  }

  getCiv(planetId: string): PlanetCiv | undefined {
    return this.civs.get(planetId);
  }

  tickAll(): void {
    for (const civ of this.civs.values()) {
      tickPlanet(civ);
    }
  }

  /** auto-tick هر interval میلی‌ثانیه */
  start(intervalMs = 5000): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tickAll(), intervalMs);
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
}

export const qureInstance = new QURE();
