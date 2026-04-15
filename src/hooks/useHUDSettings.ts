import { useState, useCallback } from "react";

export type HUDMode = "COMPACT" | "EXPANDED" | "CINEMATIC";

export interface HUDSettings {
  showOrbits: boolean;
  showLabels: boolean;
  timeSpeed: number;
  paused: boolean;
  hudMode: HUDMode;
  mouseLook: boolean;
  audioMuted: boolean;
  inertia: number; // 0..1
}

const STORAGE_KEY = "qmetaram-hud-settings";

const defaults: HUDSettings = {
  showOrbits: true,
  showLabels: true,
  timeSpeed: 1,
  paused: false,
  hudMode: "COMPACT",
  mouseLook: true,
  audioMuted: false,
  inertia: 0.4,
};

import { safeGetJSON, safeSetJSON } from "@/lib/safeParse";

type PersistedHUDSettings = Partial<HUDSettings> & {
  hudVisible?: boolean;
  feedMuted?: boolean;
};

function load(): HUDSettings {
  const parsed = safeGetJSON<Record<string, unknown>>(STORAGE_KEY, {});
  if (Object.keys(parsed).length === 0) return defaults;
  // Migrate old keys
  const p: PersistedHUDSettings = { ...parsed } as PersistedHUDSettings;
  if ("hudVisible" in p) {
    p.hudMode = p.hudVisible ? (p.hudMode || "COMPACT") : "CINEMATIC";
    delete p.hudVisible;
  }
  if ("feedMuted" in p) {
    p.audioMuted = p.feedMuted;
    delete p.feedMuted;
  }
  return { ...defaults, ...p };
}

export function useHUDSettings() {
  const [settings, setSettings] = useState<HUDSettings>(load);

  const update = useCallback((patch: Partial<HUDSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      safeSetJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { settings, update };
}
