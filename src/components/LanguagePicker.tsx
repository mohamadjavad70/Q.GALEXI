import { useState, useCallback, useRef, useEffect } from "react";
import { getLang, setLang, LANGS, type Lang } from "@/lib/i18n";

interface LanguagePickerProps {
  className?: string;
}

export default function LanguagePicker({ className = "" }: LanguagePickerProps) {
  const [lang, setLangState] = useState<Lang>(getLang);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // بستن dropdown با کلیک خارج
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = useCallback((code: Lang) => {
    setLang(code);
    setLangState(code);
    setOpen(false);
    window.dispatchEvent(new CustomEvent("lang-change", { detail: code }));
  }, []);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* دکمه فعلی */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/15 bg-black/50 hover:bg-white/10 backdrop-blur-md transition-all text-xs text-white/80 hover:text-white"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline font-medium" style={{ fontFamily: "monospace" }}>
          {current.code.toUpperCase()}
        </span>
        <svg
          className={`w-3 h-3 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full mt-2 right-0 z-50 min-w-[160px] rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl overflow-hidden"
          role="listbox"
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === lang}
              onClick={() => select(l.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left hover:bg-white/10 ${
                l.code === lang ? "bg-white/10 text-white" : "text-white/70"
              }`}
            >
              <span className="text-xl">{l.flag}</span>
              <span style={{ fontFamily: l.code === "fa" || l.code === "ar" ? "inherit" : "monospace" }}>
                {l.label}
              </span>
              {l.code === lang && (
                <span className="ml-auto text-cyan-400 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

