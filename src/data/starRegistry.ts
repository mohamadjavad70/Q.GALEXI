/**
 * QMETARAM Star Registry
 * ─────────────────────────
 * Each entry defines a star world. To add a new star:
 * 1. Add a StarConfig entry below
 * 2. Create a tool component in src/components/stars/
 * 3. Register the tool in StarWorldTemplate.tsx
 */

export interface StarConfig {
  slug: string;
  displayNameFa: string;
  displayNameEn: string;
  missionFa: string;
  missionEn: string;
  chakraColor: string;
  bgStyle: "tesla" | "matrix" | "molana" | "davinci" | "beethoven" | "placeholder";
  enabledTools: string[];
  puzzleMode: boolean;
  ambientSound: boolean;
}

export const defaultStarRegistry: StarConfig[] = [
  {
    slug: "tesla",
    displayNameFa: "تسلا",
    displayNameEn: "Tesla",
    missionFa: "آزمایشگاه ایده‌ها",
    missionEn: "Lab of Ideas",
    chakraColor: "#00d4ff",
    bgStyle: "tesla",
    enabledTools: ["idea-to-blueprint"],
    puzzleMode: false,
    ambientSound: true,
  },
  {
    slug: "matrix",
    displayNameFa: "ماتریکس",
    displayNameEn: "Matrix",
    missionFa: "رمزگشایی واقعیت",
    missionEn: "Decode Reality",
    chakraColor: "#00ff41",
    bgStyle: "matrix",
    enabledTools: ["system-decode"],
    puzzleMode: false,
    ambientSound: true,
  },
  {
    slug: "molana",
    displayNameFa: "مولانا",
    displayNameEn: "Molana",
    missionFa: "باغ روح و معنا",
    missionEn: "Garden of Soul",
    chakraColor: "#ff6b9d",
    bgStyle: "molana",
    enabledTools: ["emotion-lens"],
    puzzleMode: false,
    ambientSound: true,
  },
  {
    slug: "davinci",
    displayNameFa: "داوینچی",
    displayNameEn: "Da Vinci",
    missionFa: "استودیوی رنسانس",
    missionEn: "Renaissance Studio",
    chakraColor: "#ffd700",
    bgStyle: "davinci",
    enabledTools: ["puzzle"],
    puzzleMode: true,
    ambientSound: false,
  },
  {
    slug: "beethoven",
    displayNameFa: "بتهوون",
    displayNameEn: "Beethoven",
    missionFa: "تالار سمفونی",
    missionEn: "Symphony Hall",
    chakraColor: "#ff8c00",
    bgStyle: "beethoven",
    enabledTools: ["text-to-melody"],
    puzzleMode: false,
    ambientSound: true,
  },
  {
    slug: "nebula",
    displayNameFa: "سحابی",
    displayNameEn: "Nebula",
    missionFa: "به‌زودی...",
    missionEn: "Coming soon",
    chakraColor: "#8888aa",
    bgStyle: "placeholder",
    enabledTools: [],
    puzzleMode: false,
    ambientSound: false,
  },
  {
    slug: "aurora",
    displayNameFa: "شفق",
    displayNameEn: "Aurora",
    missionFa: "به‌زودی...",
    missionEn: "Coming soon",
    chakraColor: "#7799aa",
    bgStyle: "placeholder",
    enabledTools: [],
    puzzleMode: false,
    ambientSound: false,
  },
];

import { safeGetJSON, safeSetJSON } from "@/lib/safeParse";

/** Get star registry, checking localStorage overrides from Command Center */
export function getStarRegistry(): StarConfig[] {
  return safeGetJSON("qmetaram-stars", defaultStarRegistry);
}

/** Save modified registry (from Command Center) */
export function saveStarRegistry(registry: StarConfig[]) {
  safeSetJSON("qmetaram-stars", registry);
}

/** Get a single star by slug */
export function getStarBySlug(slug: string): StarConfig | undefined {
  return getStarRegistry().find((s) => s.slug === slug);
}

/** Star positions in the 3D galaxy scene */
export const starPositions: [number, number, number][] = [
  [-3.5, 2.5, 0],
  [4, 2, -1],
  [-1.5, -0.5, 1.5],
  [3, -2.5, 0],
  [0, -4, -1],
  [-5, 0.5, -2],
  [5.5, -0.5, -2],
];
