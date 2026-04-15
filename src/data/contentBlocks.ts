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
    subtitleFa: "شبکه کهکشانی هفت ستاره",
    subtitleEn: "Galactic 7-Star Network",
    cta: "روی یک ستاره کلیک کن ✦",
  },
  stars: {
    tesla: {
      introFa: "به آزمایشگاه ایده‌ها خوش آمدی. اینجا هر فکری به نقشه تبدیل می‌شود.",
      introEn: "Welcome to the Lab of Ideas. Every thought becomes a blueprint.",
    },
    matrix: {
      introFa: "واقعیت لایه‌هایی دارد. اینجا رمزگشایی می‌کنیم.",
      introEn: "Reality has layers. Here we decode them.",
    },
    molana: {
      introFa: "باغ روح و معنا. احساست را بنویس، ما گوش می‌دهیم.",
      introEn: "Garden of Soul. Write your feeling, we listen.",
    },
    davinci: {
      introFa: "استودیوی رنسانس. معما حل کن تا دروازه‌ها باز شوند.",
      introEn: "Renaissance Studio. Solve puzzles to unlock the gates.",
    },
    beethoven: {
      introFa: "تالار سمفونی. هر کلمه‌ای می‌تواند ملودی شود.",
      introEn: "Symphony Hall. Every word can become a melody.",
    },
    nebula: {
      introFa: "سحابی در حال شکل‌گیری است. به‌زودی...",
      introEn: "Nebula is forming. Coming soon...",
    },
    aurora: {
      introFa: "شفق قطبی هنوز طلوع نکرده. به‌زودی...",
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
