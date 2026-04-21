/**
 * Lightweight client-side i18n for QMETARAM.
 * Languages: de (default), fa (RTL), en, tr, ar (RTL), ru, zh
 */

export type Lang = "de" | "fa" | "en" | "tr" | "ar" | "ru" | "zh";

export const LANGS: { code: Lang; label: string; flag: string; dir: "rtl" | "ltr" }[] = [
  { code: "de", label: "Deutsch",  flag: "🇩🇪", dir: "ltr" },
  { code: "fa", label: "فارسی",    flag: "🇮🇷", dir: "rtl" },
  { code: "en", label: "English",  flag: "🇬🇧", dir: "ltr" },
  { code: "tr", label: "Türkçe",   flag: "🇹🇷", dir: "ltr" },
  { code: "ar", label: "العربية",  flag: "🇸🇦", dir: "rtl" },
  { code: "ru", label: "Русский",  flag: "🇷🇺", dir: "ltr" },
  { code: "zh", label: "中文",     flag: "🇨🇳", dir: "ltr" },
];

const STORAGE_KEY = "qmetaram_lang";

const messages: Record<string, Record<Lang, string>> = {
  // Navigation & common
  "nav.galaxy":        { de: "Galaxie",        fa: "کهکشان",       en: "Galaxy",        tr: "Galaksi",      ar: "المجرة",       ru: "Галактика",    zh: "星系" },
  "nav.command":       { de: "Kommandoraum",   fa: "اتاق فرمان",   en: "Command Room",  tr: "Komuta Odası", ar: "غرفة القيادة", ru: "Командный центр", zh: "指挥室" },
  "nav.commandCenter": { de: "Kommandozentrale",fa: "مرکز فرماندهی",en: "Command Center",tr: "Komuta Merkezi",ar: "مركز القيادة",ru: "Центр управления",zh: "指挥中心" },
  "nav.back":          { de: "Zurück",         fa: "بازگشت",       en: "Back",          tr: "Geri",         ar: "رجوع",         ru: "Назад",        zh: "返回" },

  // Index tabs
  "tab.stars":        { de: "Sterne",          fa: "ستاره‌ها",    en: "Stars",         tr: "Yıldızlar",    ar: "النجوم",       ru: "Звёзды",       zh: "星球" },
  "tab.market":       { de: "Markt",           fa: "مارکت",       en: "Market",        tr: "Pazar",        ar: "السوق",        ru: "Рынок",        zh: "市场" },
  "tab.chat":         { de: "Chat",            fa: "چت‌ها",       en: "Chats",         tr: "Sohbet",       ar: "المحادثات",    ru: "Чат",          zh: "聊天" },
  "tab.referral":     { de: "Empfehlung",      fa: "رفرال",       en: "Referral",      tr: "Referans",     ar: "الإحالة",      ru: "Реферал",      zh: "推荐" },
  "tab.integration":  { de: "Integration",     fa: "تلفیق",       en: "Integration",   tr: "Entegrasyon",  ar: "التكامل",      ru: "Интеграция",   zh: "集成" },
  "tab.galaxy":       { de: "Galaxie",         fa: "کهکشان",      en: "Galaxy",        tr: "Galaksi",      ar: "المجرة",       ru: "Галактика",    zh: "星系" },

  // Header welcome
  "home.welcome":     { de: "Willkommen bei Q ✦ Q NETWORK", fa: "خوش آمدی به کیو ✦ Q NETWORK", en: "Welcome to Q ✦ Q NETWORK", tr: "Q'ya Hoş Geldiniz ✦ Q NETWORK", ar: "مرحباً بك في Q ✦ Q NETWORK", ru: "Добро пожаловать в Q ✦ Q NETWORK", zh: "欢迎来到 Q ✦ Q NETWORK" },

  // HUD
  "hud.explorer":    { de: "Entdecker",    fa: "کاوشگر",       en: "Explorer",     tr: "Kaşif",        ar: "المستكشف",    ru: "Исследователь", zh: "探索者" },
  "hud.autopilot":   { de: "Autopilot",    fa: "اتوپایلوت",    en: "Autopilot",    tr: "Otopilot",     ar: "الطيار الآلي", ru: "Автопилот",    zh: "自动驾驶" },
  "hud.focus":       { de: "Fokus",        fa: "فوکوس",        en: "Focus",        tr: "Odak",         ar: "تركيز",        ru: "Фокус",        zh: "聚焦" },
  "hud.connected":   { de: "Verbunden",    fa: "متصل",         en: "Connected",    tr: "Bağlı",        ar: "متصل",         ru: "Подключено",   zh: "已连接" },
  "hud.telemetry":   { de: "Telemetrie",   fa: "تلمتری پرواز", en: "Flight Telemetry", tr: "Uçuş Telemetrisi", ar: "قياس عن بُعد", ru: "Телеметрия", zh: "遥测" },
  "hud.speed":       { de: "Geschwindigkeit", fa: "سرعت",      en: "Speed",        tr: "Hız",          ar: "السرعة",       ru: "Скорость",     zh: "速度" },
  "hud.altitude":    { de: "Höhe",         fa: "ارتفاع",       en: "Altitude",     tr: "İrtifa",       ar: "الارتفاع",     ru: "Высота",       zh: "高度" },
  "hud.orbitTime":   { de: "Umlaufzeit",   fa: "زمان مدار",    en: "Orbit Time",   tr: "Yörünge Süresi", ar: "وقت المدار",  ru: "Время орбиты", zh: "轨道时间" },
  "hud.planets":     { de: "Planeten",     fa: "سیاره‌ها",     en: "Planets",      tr: "Gezegenler",   ar: "الكواكب",      ru: "Планеты",      zh: "行星" },
  "hud.labels":      { de: "Beschriftungen", fa: "برچسب‌ها",   en: "Labels",       tr: "Etiketler",    ar: "التسميات",     ru: "Метки",        zh: "标签" },
  "hud.signals":     { de: "Signale",      fa: "سیگنال‌ها",    en: "Signals",      tr: "Sinyaller",    ar: "الإشارات",     ru: "Сигналы",      zh: "信号" },
  "hud.noSignals":   { de: "Noch keine Signale", fa: "هنوز سیگنالی نیست", en: "No signals yet", tr: "Henüz sinyal yok", ar: "لا توجد إشارات", ru: "Нет сигналов", zh: "暂无信号" },
  "hud.command":     { de: "Befehl",       fa: "فرمان",        en: "Command",      tr: "Komut",        ar: "الأمر",        ru: "Команда",      zh: "命令" },
  "hud.enter":       { de: "Eintreten ✦", fa: "ورود ✦",       en: "Enter ✦",      tr: "Gir ✦",        ar: "دخول ✦",       ru: "Войти ✦",      zh: "进入 ✦" },

  // Gate
  "gate.title":       { de: "Q Core — Kommandozugang",    fa: "Q Core — دسترسی فرماندهی", en: "Q Core — Command Access",   tr: "Q Core — Komuta Erişimi",  ar: "Q Core — وصول القيادة",    ru: "Q Core — Командный доступ", zh: "Q Core — 指挥通道" },
  "gate.passphrase":  { de: "Passphrase...",              fa: "رمز ورود...",               en: "Passphrase...",             tr: "Parola...",                ar: "كلمة المرور...",           ru: "Пароль...",                zh: "通行短语..." },
  "gate.enter":       { de: "Kommando betreten",          fa: "ورود به فرماندهی",          en: "Enter Command",            tr: "Komuta Gir",               ar: "دخول القيادة",             ru: "Войти в командование",     zh: "进入指挥" },
  "gate.cancel":      { de: "Abbrechen",                  fa: "انصراف",                   en: "Cancel",                   tr: "İptal",                    ar: "إلغاء",                    ru: "Отмена",                   zh: "取消" },
  "gate.wrongPass":   { de: "Falsche Passphrase!",        fa: "رمز اشتباه است!",           en: "Wrong passphrase!",        tr: "Yanlış parola!",           ar: "كلمة مرور خاطئة!",         ru: "Неверный пароль!",         zh: "密码错误！" },

  // Language names
  "lang.de": { de: "Deutsch",   fa: "آلمانی",    en: "German",   tr: "Almanca",  ar: "الألمانية", ru: "Немецкий", zh: "德语" },
  "lang.fa": { de: "Persisch",  fa: "فارسی",     en: "Persian",  tr: "Farsça",   ar: "الفارسية",  ru: "Персидский", zh: "波斯语" },
  "lang.en": { de: "Englisch",  fa: "انگلیسی",   en: "English",  tr: "İngilizce",ar: "الإنجليزية",ru: "Английский", zh: "英语" },
  "lang.tr": { de: "Türkisch",  fa: "ترکی",      en: "Turkish",  tr: "Türkçe",   ar: "التركية",   ru: "Турецкий", zh: "土耳其语" },
  "lang.ar": { de: "Arabisch",  fa: "عربی",      en: "Arabic",   tr: "Arapça",   ar: "العربية",   ru: "Арабский", zh: "阿拉伯语" },
  "lang.ru": { de: "Russisch",  fa: "روسی",      en: "Russian",  tr: "Rusça",    ar: "الروسية",   ru: "Русский",  zh: "俄语" },
  "lang.zh": { de: "Chinesisch",fa: "چینی",      en: "Chinese",  tr: "Çince",    ar: "الصينية",   ru: "Китайский",zh: "中文" },
};

export function getLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && LANGS.some((l) => l.code === stored)) return stored;
  } catch {
    return "de";
  }
  return "de";
}

export function setLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    void 0;
  }
  const entry = LANGS.find((l) => l.code === lang);
  document.documentElement.dir = entry?.dir ?? "ltr";
  document.documentElement.lang = lang;
}

export function t(key: string, lang?: Lang): string {
  const l = lang ?? getLang();
  return messages[key]?.[l] ?? messages[key]?.["de"] ?? key;
}

/** Initialize document direction on load */
export function initI18n() {
  const lang = getLang();
  const entry = LANGS.find((l) => l.code === lang);
  document.documentElement.dir = entry?.dir ?? "ltr";
  document.documentElement.lang = lang;
}
