// ─── useWorldReplay — React hook برای WorldReplayController ────────────────
import { useState, useEffect, useCallback } from 'react';
import { worldReplay, type ReplayState, type WorldFrame } from '../lib/worldReplay';

export interface UseWorldReplayReturn {
  status: ReplayState['status'];
  frames: WorldFrame[];
  currentIndex: number;
  currentFrame: WorldFrame | null;
  speed: number;
  error: string | null;
  load: () => Promise<void>;
  play: (speed?: number) => void;
  pause: () => void;
  seek: (index: number) => void;
  reset: () => void;
}

export function useWorldReplay(): UseWorldReplayReturn {
  const [snapshot, setSnapshot] = useState<ReplayState>(() => worldReplay.getState());

  useEffect(() => {
    return worldReplay.subscribe(setSnapshot);
  }, []);

  const load  = useCallback(() => worldReplay.loadSnapshot(), []);
  const play  = useCallback((s?: number) => worldReplay.play(s), []);
  const pause = useCallback(() => worldReplay.pause(), []);
  const seek  = useCallback((i: number) => worldReplay.seek(i), []);
  const reset = useCallback(() => worldReplay.reset(), []);

  return {
    status: snapshot.status,
    frames: snapshot.frames,
    currentIndex: snapshot.currentIndex,
    currentFrame: snapshot.frames[snapshot.currentIndex] ?? null,
    speed: snapshot.speed,
    error: snapshot.error,
    load,
    play,
    pause,
    seek,
    reset,
  };
}
