/**
 * QMETARAM Content Blocks
 * ─────────────────────────
 * Editable text blocks for Home page and Star intro sections.
 * Managed via Command Center → Content Blocks tab.
 * Stored in localStorage with fallback to defaults.
 */

export interface ContentBlocks {
  home: {
    titleEn: string;
    subtitleFa: string;
    subtitleEn: string;
    cta: string;
  };
  stars: Record<string, {
    introFa: string;
    introEn: string;
  }>;
}

export const defaultContentBlocks: ContentBlocks = {
  home: {
    titleEn: "QMETARAM",
    subtitleFa: "Galaktisches 7-Sterne-Netzwerk",
    subtitleEn: "Galactic 7-Star Network",
    cta: "Klicken Sie auf einen Stern ❆",
  },
  stars: {
    tesla: {
      introFa: "Willkommen im Ideenlabor. Hier wird jeder Gedanke zum Entwurf.",
      introEn: "Welcome to the Lab of Ideas. Every thought becomes a blueprint.",
    },
    matrix: {
      introFa: "Die Realität hat Schichten. Hier entschlüsseln wir sie.",
      introEn: "Reality has layers. Here we decode them.",
    },
    molana: {
      introFa: "Garten der Seele. Schreiben Sie Ihre Gefühle, wir hören zu.",
      introEn: "Garden of Soul. Write your feeling, we listen.",
    },
    davinci: {
      introFa: "Renaissance-Studio. Lösen Sie Rätsel, um die Tore zu öffnen.",
      introEn: "Renaissance Studio. Solve puzzles to unlock the gates.",
    },
    beethoven: {
      introFa: "Symphoniesaal. Jedes Wort kann eine Melodie werden.",
      introEn: "Symphony Hall. Every word can become a melody.",
    },
    nebula: {
      introFa: "Nebel in Entstehung. Demnächst...",
      introEn: "Nebula is forming. Coming soon...",
    },
    aurora: {
      introFa: "Polarlicht noch nicht erschienen. Demnächst...",
      introEn: "Aurora hasn't risen yet. Coming soon...",
    },
  },
};

import { safeGetJSON, safeSetJSON } from "@/lib/safeParse";

const STORAGE_KEY = "qmetaram-content";

export function getContentBlocks(): ContentBlocks {
  return safeGetJSON(STORAGE_KEY, defaultContentBlocks);
}

export function saveContentBlocks(blocks: ContentBlocks) {
  safeSetJSON(STORAGE_KEY, blocks);
}

export function getStarIntro(slug: string): { introFa: string; introEn: string } {
  const blocks = getContentBlocks();
  return blocks.stars[slug] || { introFa: "", introEn: "" };
}
