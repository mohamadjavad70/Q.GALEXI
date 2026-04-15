import { useState, useCallback } from "react";
import { getLang, setLang, type Lang } from "@/lib/i18n";

interface LanguagePickerProps {
  className?: string;
  compact?: boolean;
}

export default function LanguagePicker({ className, compact }: LanguagePickerProps) {
  const [lang, setLangState] = useState<Lang>(getLang);

  const toggle = useCallback(() => {
    const next: Lang = lang === "fa" ? "en" : "fa";
    setLang(next);
    setLangState(next);
    window.dispatchEvent(new Event("lang-change"));
  }, [lang]);

  const base = "flex items-center rounded-md overflow-hidden border border-border/20 text-[9px] font-medium";

  return (
    <div className={`${base} ${className ?? ""}`}>
      <button
        onClick={lang === "fa" ? undefined : toggle}
        className={`px-1.5 py-0.5 transition-colors ${
          lang === "fa"
            ? "bg-primary/20 text-primary"
            : "text-muted-foreground/60 hover:text-foreground"
        }`}
      >
        فا
      </button>
      <button
        onClick={lang === "en" ? undefined : toggle}
        className={`px-1.5 py-0.5 transition-colors ${
          lang === "en"
            ? "bg-primary/20 text-primary"
            : "text-muted-foreground/60 hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}
