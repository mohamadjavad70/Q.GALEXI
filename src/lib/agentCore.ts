// ─── Q Civilization Engine — Agent Core ──────────────────────────────────────
// هسته موجودیت‌های زنده داخل سیارات

export type EmotionType = 'positive' | 'neutral' | 'negative';
export type AgentRole = 'creator' | 'trader' | 'explorer' | 'guardian';
export type AgentAction = 'explore' | 'create' | 'trade' | 'rest' | 'guard';

export interface Memory {
  event: string;
  timestamp: number;
  emotion: EmotionType;
}

export interface AgentPersonality {
  curiosity: number;   // 0–1
  aggression: number;  // 0–1
  creativity: number;  // 0–1
}

export interface AgentState {
  energy: number;      // 0–100
  knowledge: number;   // 0+
}

export interface CivAgent {
  id: string;
  name: string;
  role: AgentRole;
  personality: AgentPersonality;
  goals: string[];
  memory: Memory[];
  state: AgentState;
}

// ─── ساخت Agent با شخصیت بر اساس نقش ────────────────────────────────────────
const BASE_PERSONALITIES: Record<AgentRole, AgentPersonality> = {
  explorer:  { curiosity: 0.9, aggression: 0.2, creativity: 0.5 },
  creator:   { curiosity: 0.5, aggression: 0.1, creativity: 0.9 },
  trader:    { curiosity: 0.4, aggression: 0.6, creativity: 0.3 },
  guardian:  { curiosity: 0.3, aggression: 0.8, creativity: 0.2 },
};

export function createAgent(id: string, name: string, role: AgentRole): CivAgent {
  return {
    id,
    name,
    role,
    personality: { ...BASE_PERSONALITIES[role] },
    goals: defaultGoals(role),
    memory: [],
    state: { energy: 100, knowledge: 0 },
  };
}

function defaultGoals(role: AgentRole): string[] {
  const map: Record<AgentRole, string[]> = {
    explorer:  ['کشف مناطق جدید', 'افزایش دانش سیاره'],
    creator:   ['ساخت ساختارها', 'تولید منابع'],
    trader:    ['تراکنش توکن', 'ایجاد بازار داخلی'],
    guardian:  ['حفظ ثبات', 'کنترل تورم'],
  };
  return map[role];
}

// ─── حافظه (با decay خودکار) ─────────────────────────────────────────────────
export function addMemory(agent: CivAgent, event: string, emotion: EmotionType): void {
  agent.memory.push({ event, emotion, timestamp: Date.now() });
  if (agent.memory.length > 50) agent.memory.shift();
}

export function lastMemory(agent: CivAgent): Memory | null {
  return agent.memory.at(-1) ?? null;
}

// ─── موتور تصمیم‌گیری (personality-driven) ───────────────────────────────────
export function decide(agent: CivAgent): AgentAction {
  if (agent.state.energy < 30) return 'rest';
  const { curiosity, creativity, aggression } = agent.personality;
  if (curiosity > 0.7) return 'explore';
  if (creativity > 0.6) return 'create';
  if (aggression > 0.6) return 'guard';
  return 'trade';
}
