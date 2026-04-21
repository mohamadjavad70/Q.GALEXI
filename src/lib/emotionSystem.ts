// ─── Q Emotion System — سیستم احساسات agent ────────────────────────────────
// نگاشت energy + memory + personality + رفتار → حالت روانی قابل رندر

import type { CivAgent, EmotionType } from './agentCore';
import type { BehaviorState } from './agentBrain';

// ── انواع احساس ────────────────────────────────────────────────────────────────
export type Emotion = 'calm' | 'curious' | 'excited' | 'tired' | 'aggressive' | 'fearful';

// ── رنگ و شدت هر احساس (برای Three.js emissive) ────────────────────────────
export const EMOTION_PALETTE: Record<Emotion, { color: string; emissive: string; intensity: number }> = {
  calm:       { color: '#00bfff',  emissive: '#004466', intensity: 0.6 },
  curious:    { color: '#00ff88',  emissive: '#004422', intensity: 0.85 },
  excited:    { color: '#ffdd00',  emissive: '#664400', intensity: 1.1 },
  tired:      { color: '#556677',  emissive: '#111222', intensity: 0.25 },
  aggressive: { color: '#ff2244',  emissive: '#880011', intensity: 1.2 },
  fearful:    { color: '#aa44ff',  emissive: '#330055', intensity: 0.7 },
};

export interface EmotionState {
  current: Emotion;
  intensity: number;   // 0–1 — خروجی lerp شده برای material
  previous: Emotion;
  transitionT: number; // 0→1 برای smooth blend رنگ
}

// ─── جدول اشتقاق احساس از وضعیت agent ────────────────────────────────────────
export function deriveEmotion(
  agent: Pick<CivAgent, 'state' | 'personality' | 'memory'>,
  behavior: BehaviorState,
): Emotion {
  const { energy } = agent.state;
  const { curiosity, aggression } = agent.personality;

  // انرژی خیلی کم → خستگی
  if (energy < 20) return 'tired';

  // در حال تعامل با player → هیجان‌زده
  if (behavior === 'interacting') return 'excited';

  // آخرین حافظه منفی → ترس
  const last = agent.memory.at(-1);
  if (last && last.emotion === 'negative') return 'fearful';

  // شخصیت پرتکاپو + در حال کار
  if (aggression > 0.65 && behavior === 'working') return 'aggressive';

  // شخصیت کنجکاو + wandering
  if (curiosity > 0.65 && behavior === 'wandering') return 'curious';

  // حالت‌های پرانرژی
  if (energy > 80 && last?.emotion === 'positive') return 'excited';

  return 'calm';
}

/** تبدیل EmotionType از agentCore به Emotion عمیق‌تر */
export function fromCoreEmotion(e: EmotionType): Emotion {
  if (e === 'positive') return 'excited';
  if (e === 'negative') return 'fearful';
  return 'calm';
}

// ─── ایجاد وضعیت اولیه ────────────────────────────────────────────────────────
export function createEmotionState(): EmotionState {
  return { current: 'calm', intensity: 0.6, previous: 'calm', transitionT: 1 };
}

// ─── یک قدم به‌روزرسانی (در useFrame) ────────────────────────────────────────
export function stepEmotion(
  state: EmotionState,
  next: Emotion,
  delta: number,
): EmotionState {
  if (state.current !== next) {
    return {
      current: next,
      previous: state.current,
      transitionT: 0,
      intensity: EMOTION_PALETTE[next].intensity,
    };
  }
  return {
    ...state,
    transitionT: Math.min(1, state.transitionT + delta * 2.5), // ~0.4s transition
  };
}

// ─── رنگ blended بر اساس transitionT ─────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function lerpColor(a: string, b: string, t: number): [number, number, number] {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return [ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t];
}

export function blendedEmissive(state: EmotionState): [number, number, number] {
  const prev = EMOTION_PALETTE[state.previous].emissive;
  const curr = EMOTION_PALETTE[state.current].emissive;
  return lerpColor(prev, curr, state.transitionT);
}

export function blendedColor(state: EmotionState): [number, number, number] {
  const prev = EMOTION_PALETTE[state.previous].color;
  const curr = EMOTION_PALETTE[state.current].color;
  return lerpColor(prev, curr, state.transitionT);
}
