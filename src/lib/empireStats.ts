/**
 * Empire Statistics Engine
 * ─────────────────────────
 * Aggregates module readiness, integrity, and growth data
 * for HUD telemetry and monitoring dashboard.
 */

export interface ModuleStatus {
  name: string;
  nameFa: string;
  slug: string;
  readiness: number; // 0-100
  color: string;
  category: "ai" | "security" | "finance" | "creative" | "science" | "wisdom";
}

export interface EmpireSnapshot {
  integrity: number;         // overall system health 0-100
  totalModules: number;
  activeModules: number;
  readinessAvg: number;
  modules: ModuleStatus[];
  growthHistory: { week: string; ai: number; security: number; finance: number; creative: number }[];
  globalReach: { region: string; percent: number }[];
}

const MODULES: ModuleStatus[] = [
  { name: "Matrix",        nameFa: "ماتریکس",    slug: "matrix",    readiness: 85, color: "#00ff41", category: "ai" },
  { name: "Tesla",         nameFa: "تسلا",       slug: "tesla",     readiness: 78, color: "#00d4ff", category: "science" },
  { name: "Da Vinci",      nameFa: "داوینچی",     slug: "davinci",   readiness: 72, color: "#ffd700", category: "creative" },
  { name: "Beethoven",     nameFa: "بتهوون",     slug: "beethoven", readiness: 65, color: "#ff8c00", category: "creative" },
  { name: "Mowlana",       nameFa: "مولانا",      slug: "molana",    readiness: 90, color: "#ff6b9d", category: "wisdom" },
  { name: "Guardian",      nameFa: "نگهبان",      slug: "guardian",  readiness: 88, color: "#8b5cf6", category: "security" },
  { name: "Quantum Pulse", nameFa: "پالس کوانتوم", slug: "quantum",   readiness: 45, color: "#06b6d4", category: "science" },
  { name: "Biruni",        nameFa: "بیرونی",      slug: "biruni",    readiness: 40, color: "#10b981", category: "science" },
  { name: "Samer Exchange",nameFa: "صرافی سمیر",  slug: "samer",     readiness: 35, color: "#f59e0b", category: "finance" },
  { name: "Cryptographer", nameFa: "رمزنگار",     slug: "crypto",    readiness: 55, color: "#ec4899", category: "security" },
  { name: "Orchestrator",  nameFa: "ارکستراتور",  slug: "orchestrator", readiness: 60, color: "#a855f7", category: "ai" },
  { name: "Automator",     nameFa: "اتوماتور",    slug: "automator", readiness: 50, color: "#14b8a6", category: "ai" },
];

const GROWTH_HISTORY = [
  { week: "W1", ai: 20, security: 30, finance: 10, creative: 15 },
  { week: "W2", ai: 35, security: 40, finance: 20, creative: 30 },
  { week: "W3", ai: 45, security: 55, finance: 30, creative: 45 },
  { week: "W4", ai: 55, security: 65, finance: 38, creative: 55 },
  { week: "W5", ai: 70, security: 78, finance: 45, creative: 62 },
  { week: "W6", ai: 82, security: 88, finance: 55, creative: 72 },
];

const GLOBAL_REACH = [
  { region: "UAE", percent: 42 },
  { region: "USA", percent: 28 },
  { region: "UK",  percent: 15 },
  { region: "DE",  percent: 8 },
  { region: "Other", percent: 7 },
];

export function getEmpireSnapshot(): EmpireSnapshot {
  const activeModules = MODULES.filter(m => m.readiness > 30).length;
  const readinessAvg = Math.round(MODULES.reduce((s, m) => s + m.readiness, 0) / MODULES.length);
  const integrity = Math.round(
    (activeModules / MODULES.length) * 40 +
    readinessAvg * 0.6
  );

  return {
    integrity,
    totalModules: MODULES.length,
    activeModules,
    readinessAvg,
    modules: MODULES,
    growthHistory: GROWTH_HISTORY,
    globalReach: GLOBAL_REACH,
  };
}
