/**
 * Lightweight client-side i18n for QMETARAM.
 * Languages: fa (RTL, default), en (LTR).
 */

export type Lang = "fa" | "en";

const STORAGE_KEY = "qmetaram_lang";

const messages: Record<string, Record<Lang, string>> = {
  // Navigation & common
  "nav.galaxy": { fa: "کهکشان", en: "Galaxy" },
  "nav.command": { fa: "اتاق فرمان", en: "Command Room" },
  "nav.commandCenter": { fa: "مرکز فرماندهی", en: "Command Center" },
  "nav.back": { fa: "بازگشت", en: "Back" },

  // HUD
  "hud.explorer": { fa: "کاوشگر", en: "Explorer" },
  "hud.autopilot": { fa: "اتوپایلوت", en: "Autopilot" },
  "hud.focus": { fa: "فوکوس", en: "Focus" },
  "hud.connected": { fa: "متصل", en: "Connected" },
  "hud.telemetry": { fa: "تلمتری پرواز", en: "Flight Telemetry" },
  "hud.speed": { fa: "سرعت", en: "Speed" },
  "hud.altitude": { fa: "ارتفاع", en: "Altitude" },
  "hud.orbitTime": { fa: "زمان مدار", en: "Orbit Time" },
  "hud.scrub": { fa: "اسکرول", en: "Scrub" },
  "hud.orbits": { fa: "مدارها", en: "Orbits" },
  "hud.labels": { fa: "برچسب‌ها", en: "Labels" },
  "hud.mouseLook": { fa: "نگاه ماوس", en: "Mouse Look" },
  "hud.explorerActive": { fa: "کاوشگر فعال", en: "Explorer Active" },
  "hud.autoOrbit": { fa: "مدار خودکار", en: "Auto Orbit" },
  "hud.navConsole": { fa: "کنسول ناوبری", en: "Nav Console" },
  "hud.goToPlanet": { fa: "برو به سیاره...", en: "Go to planet..." },
  "hud.cancelAutopilot": { fa: "لغو اتوپایلوت", en: "Cancel Autopilot" },
  "hud.release": { fa: "آزاد", en: "Release" },
  "hud.enter": { fa: "ورود ✦", en: "Enter ✦" },
  "hud.signals": { fa: "سیگنال‌ها", en: "Signals" },
  "hud.noSignals": { fa: "هنوز سیگنالی نیست", en: "No signals yet" },
  "hud.command": { fa: "فرمان", en: "Command" },
  "hud.ownerOnly": { fa: "فقط برای فرمانده", en: "Owner only" },
  "hud.planets": { fa: "سیاره‌ها", en: "Planets" },

  // Sun / Q Core gate
  "gate.title": { fa: "Q Core — دسترسی فرماندهی", en: "Q Core — Command Access" },
  "gate.passphrase": { fa: "رمز ورود...", en: "Passphrase..." },
  "gate.enter": { fa: "ورود به فرماندهی", en: "Enter Command" },
  "gate.cancel": { fa: "انصراف", en: "Cancel" },
  "gate.wrongPass": { fa: "رمز اشتباه است!", en: "Wrong passphrase!" },
  "gate.demoNote": { fa: "دروازه دمو (سمت کلاینت)", en: "Demo gate (client-side)" },
  "gate.quietRoom": { fa: "اتاق آرام (Q)", en: "Quiet Room (Q)" },
  "gate.commandRoom": { fa: "اتاق فرمان", en: "Command Room" },

  // Command Room (public)
  "cmd.galaxyStatus": { fa: "وضعیت کهکشان", en: "Galaxy Status" },
  "cmd.online": { fa: "آنلاین", en: "Online" },
  "cmd.demo": { fa: "دمو", en: "Demo" },
  "cmd.lastActivity": { fa: "آخرین فعالیت", en: "Last Activity" },
  "cmd.planetStatus": { fa: "وضعیت سیارات", en: "Planet Status" },
  "cmd.active": { fa: "فعال", en: "Active" },
  "cmd.comingSoon": { fa: "به‌زودی", en: "Coming Soon" },
  "cmd.rankings": { fa: "رتبه‌بندی", en: "Rankings" },
  "cmd.signals": { fa: "سیگنال‌ها", en: "Signals" },
  "cmd.activity": { fa: "فعالیت اخیر", en: "Recent Activity" },
  "cmd.noActivity": { fa: "هنوز فعالیتی ثبت نشده", en: "No activity yet" },
  "cmd.actions": { fa: "عمل", en: "actions" },

  // Language
  "lang.fa": { fa: "فارسی", en: "فارسی" },
  "lang.en": { fa: "English", en: "English" },
};

export function getLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "fa" || stored === "en") return stored;
  } catch {
    return "fa";
  }
  return "fa";
}

export function setLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    void 0;
  }
  document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

export function t(key: string, lang?: Lang): string {
  const l = lang ?? getLang();
  return messages[key]?.[l] ?? key;
}

/** Initialize document direction on load */
export function initI18n() {
  const lang = getLang();
  document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}
