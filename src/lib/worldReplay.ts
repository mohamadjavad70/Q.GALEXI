// ─── World Replay — بازپخش snapshot جهان Q ─────────────────────────────────
// بارگذاری snapshot از API → پخش frame به frame با کنترل زمانی

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as Record<string, unknown>).env)
  ? ((import.meta as { env: Record<string, string> }).env.VITE_API_URL ?? 'http://localhost:3001')
  : 'http://localhost:3001';

// ─── ساختار یک frame در replay ────────────────────────────────────────────────
export interface ReplayAgent {
  id: string;
  name: string;
  role: string;
  energy: number;
  knowledge: number;
  lastMemory: string | null;
}

export interface ReplayPlanet {
  id: string;
  qTokens: number;
  tick: number;
  agents: number;
  lastLog: string | null;
}

export interface WorldFrame {
  timestamp: string;
  planets: number;
  totalQTokens: number;
  totalAgents: number;
  civilizations: ReplayPlanet[];
  balances: Record<string, number>;
  /** شناسه frame برای مقایسه */
  frameIndex: number;
}

// ─── وضعیت پخش ───────────────────────────────────────────────────────────────
export type ReplayStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export interface ReplayState {
  status: ReplayStatus;
  frames: WorldFrame[];
  currentIndex: number;
  speed: number;        // ضریب سرعت (0.5x — 4x)
  error: string | null;
}

// ─── کنترل‌کننده Replay ────────────────────────────────────────────────────────
export class WorldReplayController {
  private state: ReplayState = {
    status: 'idle',
    frames: [],
    currentIndex: 0,
    speed: 1,
    error: null,
  };

  private listeners: Array<(s: ReplayState) => void> = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  /** فهرست تاریخچه snapshot‌ها (دریافت از API) */
  private history: WorldFrame[] = [];

  /** ثبت listener برای دریافت تغییرات */
  subscribe(fn: (s: ReplayState) => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private emit(): void {
    const s = { ...this.state, frames: [...this.state.frames] };
    this.listeners.forEach(fn => fn(s));
  }

  getState(): ReplayState {
    return { ...this.state, frames: [...this.state.frames] };
  }

  /** بارگذاری snapshot فعلی از سرور */
  async loadSnapshot(): Promise<void> {
    this.state = { ...this.state, status: 'loading', error: null };
    this.emit();
    try {
      const res = await fetch(`${API_BASE}/snapshot`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = (await res.json()) as Omit<WorldFrame, 'frameIndex'>;
      const frame: WorldFrame = { ...raw, frameIndex: this.history.length };
      this.history.push(frame);
      this.state = {
        ...this.state,
        status: 'paused',
        frames: [...this.history],
        currentIndex: this.history.length - 1,
      };
    } catch (e) {
      this.state = {
        ...this.state,
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
      };
    }
    this.emit();
  }

  /** افزودن frame به صورت دستی (برای تست) */
  addFrame(frame: Omit<WorldFrame, 'frameIndex'>): void {
    const f: WorldFrame = { ...frame, frameIndex: this.history.length };
    this.history.push(f);
    this.state = {
      ...this.state,
      frames: [...this.history],
      currentIndex: this.state.status === 'playing' ? this.state.currentIndex : this.history.length - 1,
    };
    this.emit();
  }

  /** پخش از frameIndex فعلی */
  play(speed = 1): void {
    if (this.state.frames.length === 0) return;
    this.stop();
    this.state = { ...this.state, status: 'playing', speed };
    this.emit();

    const intervalMs = Math.round(1500 / speed);  // هر frame به ثانیه‌های واقعی
    this.timer = setInterval(() => {
      const next = this.state.currentIndex + 1;
      if (next >= this.state.frames.length) {
        this.state = { ...this.state, status: 'ended', currentIndex: this.state.frames.length - 1 };
        this.stop();
      } else {
        this.state = { ...this.state, currentIndex: next };
      }
      this.emit();
    }, intervalMs);
  }

  pause(): void {
    this.stop();
    this.state = { ...this.state, status: 'paused' };
    this.emit();
  }

  /** رفتن به frame خاص */
  seek(index: number): void {
    const clamped = Math.max(0, Math.min(this.state.frames.length - 1, index));
    this.state = { ...this.state, currentIndex: clamped };
    this.emit();
  }

  /** برگشت به ابتدا */
  reset(): void {
    this.stop();
    this.history = [];
    this.state = { status: 'idle', frames: [], currentIndex: 0, speed: 1, error: null };
    this.emit();
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** frame فعلی (null اگر موجود نباشد) */
  currentFrame(): WorldFrame | null {
    return this.state.frames[this.state.currentIndex] ?? null;
  }
}

// ─── singleton — قابل استفاده در hook ─────────────────────────────────────────
export const worldReplay = new WorldReplayController();
