/**
 * QMETARAM — Hauptseite
 * Bereiche: Sterne | Markt | Chat | Empfehlung | Integration | Galaxie
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getStarRegistry } from "@/data/starRegistry";
import { defaultEconomy } from "@/data/economy";
import { defaultConnectors } from "@/data/integrations";
import CouncilChat from "@/components/CouncilChat";
import SunCoreChatEnhanced from "@/components/SunCoreChatEnhanced";
import LanguagePicker from "@/components/LanguagePicker";
import { getLang, t, LANGS, type Lang } from "@/lib/i18n";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type Tab = "stars" | "market" | "chat" | "referral" | "integration" | "galaxy";

interface VoteData { bluePercent: number; redPercent: number; total: number; }

function Starfield() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    r: Math.random() * 1.4 + 0.3, delay: Math.random() * 5, dur: Math.random() * 3 + 2,
  }));
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
      {stars.map(s => (
        <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white">
          <animate attributeName="opacity" values="0.15;1;0.15" dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const [lang, setLangState] = useState<Lang>(getLang);
  const [tab, setTab] = useState<Tab>("stars");
  const [councilOpen, setCouncilOpen] = useState(false);
  const [sunOpen, setSunOpen] = useState(false);
  const [votes, setVotes] = useState<VoteData>({ bluePercent: 59, redPercent: 41, total: 211 });
  const [galaxySide, setGalaxySide] = useState<"blue" | "red" | null>(null);
  const [referralCode] = useState(() => "Q" + Math.random().toString(36).slice(2, 8).toUpperCase());
  const [referralCopied, setReferralCopied] = useState(false);
  const hasVoted = useRef(false);
  const stars = getStarRegistry();
  const coins = defaultEconomy.coins.slice(0, 8);
  const connectors = defaultConnectors;

  // Sprache mit Event aktualisieren
  useEffect(() => {
    const handler = (e: Event) => {
      const code = (e as CustomEvent<Lang>).detail;
      if (LANGS.some((l) => l.code === code)) setLangState(code);
    };
    window.addEventListener("lang-change", handler);
    return () => window.removeEventListener("lang-change", handler);
  }, []);

  const fetchVotes = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/votes`);
      if (r.ok) setVotes(await r.json());
    } catch { /* offline */ }
  }, []);

  useEffect(() => {
    void fetchVotes();
    const id = setInterval(fetchVotes, 5000);
    return () => clearInterval(id);
  }, [fetchVotes]);

  const handleVote = useCallback(async (choice: "blue" | "red") => {
    setGalaxySide(p => p === choice ? null : choice);
    if (hasVoted.current) return;
    hasVoted.current = true;
    try {
      const r = await fetch(`${API_BASE}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice }),
      });
      if (r.ok) setVotes(await r.json());
    } catch { /* offline */ }
  }, []);

  const copyReferral = () => {
    navigator.clipboard.writeText(`https://qmetaram.com?ref=${referralCode}`).catch(() => {});
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  };

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "stars",       label: t("tab.stars", lang),       icon: "⭐" },
    { id: "market",      label: t("tab.market", lang),      icon: "💎" },
    { id: "chat",        label: t("tab.chat", lang),        icon: "💬" },
    { id: "referral",    label: t("tab.referral", lang),    icon: "🤝" },
    { id: "integration", label: t("tab.integration", lang), icon: "🔗" },
    { id: "galaxy",      label: t("tab.galaxy", lang),      icon: "🌌" },
  ];

  const starIcons: Record<string, string> = {
    tesla: "⚡", matrix: "🟢", molana: "🌹", davinci: "🎨",
    beethoven: "🎵", nebula: "🌫️", aurora: "🌈",
    star8: "✨", star9: "💫", star10: "🔮", star11: "🌟",
  };

  const currentLang = LANGS.find((l) => l.code === lang);
  const isRtl = currentLang?.dir === "rtl";

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col overflow-x-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <Starfield />

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <LanguagePicker className="flex-shrink-0" />
        <div className="text-center flex-1 px-2">
          <h1 style={{
            fontFamily: "monospace", fontSize: "clamp(13px,2.2vw,20px)", fontWeight: 900,
            letterSpacing: "0.1em",
            background: "linear-gradient(90deg,#38bdf8,#a78bfa,#f87171)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {t("home.welcome", lang)}
          </h1>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "monospace", letterSpacing: 2, marginTop: 1 }}>
            QMETARAM · SWITZERLAND · DUNS 487142097
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => navigate("/galaxy")} className="px-3 py-1.5 text-[11px] border border-cyan-500/30 rounded-full text-cyan-300/60 hover:bg-cyan-900/30 transition-all">🌌 Galaxie</button>
          <button onClick={() => navigate("/empire")} className="px-3 py-1.5 text-[11px] border border-purple-500/30 rounded-full text-purple-300/60 hover:bg-purple-900/30 transition-all">👑 Kommando</button>
        </div>
      </div>

      {/* Reward ribbon */}
      <div className="relative z-20 flex justify-center px-4 py-2">
        <div style={{
          display: "flex", gap: 12, padding: "4px 14px", background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, backdropFilter: "blur(10px)",
          fontSize: 11, fontFamily: "monospace", flexWrap: "wrap", justifyContent: "center",
        }}>
          <span style={{ color: "#a78bfa" }}>🎁 Registrierung = <b style={{ color: "#c4b5fd" }}>10 Q</b> Geschenk</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ color: "#34d399" }}>📅 Täglich <b style={{ color: "#6ee7b7" }}>3 Q</b> = 3$</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ color: "#fbbf24" }}>🤝 Freunde einladen = <b style={{ color: "#fde68a" }}>7$</b> Provision</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="relative z-20 flex justify-center px-4 py-2">
        <div className="flex gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                tab === t.id ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"
              }`}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 px-4 pb-10 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>

            {/* ── STARS ────────────────────────────────────────────── */}
            {tab === "stars" && (
              <div className="mt-4">
                <h2 className="text-center text-xs font-mono text-white/40 tracking-widest mb-5">⭐ Sterne der Q-Galaxie</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {stars.map(star => (
                    <motion.button key={star.slug} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => navigate(`/star/${star.slug}`)}
                      className="relative flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden"
                      style={{ background: `radial-gradient(ellipse at 50% 0%, ${star.chakraColor}20 0%, rgba(0,0,0,0.65) 70%)`, borderColor: `${star.chakraColor}35` }}>
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                        style={{ background: `radial-gradient(circle, ${star.chakraColor}25 0%, transparent 70%)`, boxShadow: `0 0 18px ${star.chakraColor}35` }}>
                        {starIcons[star.slug] ?? "🌟"}
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-sm">{star.displayNameFa}</p>
                        <p className="text-white/35 text-[10px] font-mono mt-0.5">{star.displayNameEn}</p>
                        <p className="text-white/55 text-[11px] mt-1">{star.missionFa}</p>
                      </div>
                      <div className="w-full h-px rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${star.chakraColor}70, transparent)` }} />
                      <span className="text-[9px] font-mono" style={{ color: star.chakraColor }}>Stern betreten ←</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* ── MARKET ───────────────────────────────────────────── */}
            {tab === "market" && (
              <div className="mt-4">
                <h2 className="text-center text-xs font-mono text-white/40 tracking-widest mb-5">💎 Sternenmünzen-Markt</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {coins.map(coin => (
                    <div key={coin.starSlug} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-black/40 flex-shrink-0">
                        {starIcons[coin.starSlug] ?? "💎"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-sm">{coin.nameFa}</span>
                          <span className="text-[10px] font-mono text-white/30 bg-white/10 px-1.5 py-0.5 rounded">{coin.ticker}</span>
                        </div>
                        <p className="text-white/45 text-[11px] mt-0.5 truncate">{coin.utilities}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-emerald-400 font-mono font-bold text-sm">{coin.price} <span className="text-white/25 text-[10px]">Q</span></span>
                          <span className="text-white/25 text-[10px]">{coin.supply.toLocaleString()} Angebot</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-white/20 text-[10px] font-mono mt-6">Interne Wirtschaft — Offchain Demo — Keine echte Währung</p>
              </div>
            )}

            {/* ── CHAT ─────────────────────────────────────────────── */}
            {tab === "chat" && (
              <div className="mt-4">
                <h2 className="text-center text-xs font-mono text-white/40 tracking-widest mb-5">💬 Q-Ratschat-Zentrum</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  {([
                    { title: "Q-Rat", subtitle: "Council Chat — Gemeinschaftsentscheidung", icon: "👥", color: "#a78bfa", action: () => setCouncilOpen(true) },
                    { title: "GolGolab / SunCore", subtitle: "Exekutivkern — Analyse & Aktion", icon: "🌸", color: "#fb7185", action: () => setSunOpen(true) },
                    { title: "Kommandozentrale", subtitle: "Empire Dashboard + Exekutiv-Chats", icon: "👑", color: "#fbbf24", action: () => navigate("/empire") },
                    { title: "Kommandoraum", subtitle: "Command Room — Sternen-Rangliste", icon: "📡", color: "#38bdf8", action: () => navigate("/command") },
                  ] as { title: string; subtitle: string; icon: string; color: string; action: () => void }[]).map((c, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={c.action}
                      className="flex items-center gap-4 p-5 rounded-2xl border text-right transition-all w-full"
                      style={{ background: `radial-gradient(ellipse at 0% 50%, ${c.color}12, rgba(0,0,0,0.5))`, borderColor: `${c.color}28` }}>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `${c.color}18`, boxShadow: `0 0 14px ${c.color}25` }}>
                        {c.icon}
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-white font-bold">{c.title}</p>
                        <p className="text-white/45 text-[11px] mt-0.5">{c.subtitle}</p>
                      </div>
                      <span className="text-white/25 text-lg">←</span>
                    </motion.button>
                  ))}
                </div>
                <p className="text-center text-white/20 text-[10px] font-mono">Chats arbeiten offline — verbinden sich wenn API aktiv ist</p>
              </div>
            )}

            {/* ── REFERRAL ─────────────────────────────────────────── */}
            {tab === "referral" && (
              <div className="mt-4 max-w-lg mx-auto">
                <h2 className="text-center text-xs font-mono text-white/40 tracking-widest mb-5">🤝 Empfehlungssystem</h2>
                <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-center mb-4">
                  <p className="text-amber-300/60 text-xs font-mono mb-3">Ihr Einladungslink</p>
                  <div className="flex items-center gap-2 bg-black/50 rounded-xl p-3 border border-amber-500/20 mb-3">
                    <span className="flex-1 text-amber-300 font-mono text-xs truncate">qmetaram.com?ref={referralCode}</span>
                    <button onClick={copyReferral} className="text-xs px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/30 rounded-lg text-amber-300 transition-all flex-shrink-0">
                      {referralCopied ? "✓ Kopiert!" : "Kopieren"}
                    </button>
                  </div>
                  <p className="text-white/35 text-[10px]">Ihr Code: <span className="text-amber-400 font-bold">{referralCode}</span></p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { icon: "🎁", title: "Neue Registrierung", value: "+10 Q", desc: "Jeder der sich mit Ihrem Link registriert" },
                    { icon: "📅", title: "Tägliche Belohnung", value: "+3 Q/Tag", desc: "Für jeden aktiven Einlogg-Tag" },
                    { icon: "💰", title: "Kaufprovision", value: "7$", desc: "Für jeden Kauf der Eingeladenen" },
                    { icon: "👑", title: "VIP-Club", value: "TOP 1000", desc: "Meiste Einladungen = Spezialzugang" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-2xl">{r.icon}</span>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{r.title}</p>
                        <p className="text-white/45 text-[11px]">{r.desc}</p>
                      </div>
                      <span className="text-emerald-400 font-mono font-bold text-sm">{r.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-4 rounded-xl bg-cyan-950/25 border border-cyan-500/20 text-center">
                  <p className="text-cyan-300 font-bold text-sm mb-1">Kontakt & Zusammenarbeit</p>
                  <a href="mailto:metarix.ai@gmail.com" className="text-cyan-400/60 text-xs hover:text-cyan-300 transition-colors">metarix.ai@gmail.com</a>
                  <span className="text-white/20 mx-2">·</span>
                  <a href="https://wa.me/41762970970" target="_blank" rel="noopener noreferrer" className="text-green-400/60 text-xs hover:text-green-300 transition-colors">+41 76 297 09 70</a>
                </div>
              </div>
            )}

            {/* ── INTEGRATION ──────────────────────────────────────── */}
            {tab === "integration" && (
              <div className="mt-4">
                <h2 className="text-center text-xs font-mono text-white/40 tracking-widest mb-5">🔗 Integration & Verbindungen</h2>
                {(["social", "ai", "device"] as const).map(cat => {
                  const items = connectors.filter(c => c.category === cat);
                  const catNames: Record<string, string> = {
                    social: "Soziale Netzwerke",
                    ai: "Künstliche Intelligenz",
                    device: "Geräte",
                  };
                  if (!items.length) return null;
                  return (
                    <div key={cat} className="mb-6">
                      <h3 className="text-xs font-mono text-white/30 tracking-widest mb-3 uppercase">{catNames[cat]}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {items.map(conn => (
                          <div key={conn.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                            <span className="text-xl">{conn.icon}</span>
                            <div>
                              <p className="text-white/75 text-xs font-medium">{conn.nameFa}</p>
                              <span className={`text-[9px] font-mono ${conn.permission === "revoked" ? "text-red-400/55" : "text-emerald-400/65"}`}>
                                {conn.permission === "revoked" ? "Inaktiv" : conn.permission}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <p className="text-center text-white/20 text-[10px] font-mono mt-4">Zur Aktivierung besuchen Sie die Q Core Seite</p>
              </div>
            )}

            {/* ── GALAXY ───────────────────────────────────────────── */}
            {tab === "galaxy" && (
              <div className="mt-4">
                <h2 className="text-center text-xs font-mono text-white/40 tracking-widest mb-4">🌌 Galaxie Q — Abstimmung</h2>
                <div className="flex w-full h-72 rounded-2xl overflow-hidden border border-white/10 mb-3">
                  {/* Blue */}
                  <motion.div
                    animate={{ flex: galaxySide === "red" ? 0.1 : galaxySide === "blue" ? 0.9 : 0.5 }}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                    onClick={() => handleVote("blue")}
                    className="relative flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                    style={{ background: "linear-gradient(160deg,#020b1a,#061631)" }}>
                    <div className="text-4xl mb-2" style={{ animation: "spin 20s linear infinite" }}>🌌</div>
                    <p className="text-blue-300 font-bold">Galaxie</p>
                    <p className="text-blue-400/60 text-2xl font-mono font-black">{votes.bluePercent}%</p>
                    {galaxySide === "blue" && (
                      <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        onClick={e => { e.stopPropagation(); navigate("/galaxy"); }}
                        className="mt-3 px-5 py-2 bg-blue-600/50 border border-blue-400/60 rounded-2xl text-white text-sm">
                        🚀 Galaxie betreten
                      </motion.button>
                    )}
                  </motion.div>
                  {/* Divider */}
                  <div className="w-px bg-white/15 flex-shrink-0 relative flex items-center justify-center">
                    <button onClick={() => setGalaxySide(null)} className="absolute w-7 h-7 rounded-full bg-white/10 border border-white/25 text-xs flex items-center justify-center hover:bg-white/20">✦</button>
                  </div>
                  {/* Red */}
                  <motion.div
                    animate={{ flex: galaxySide === "blue" ? 0.1 : galaxySide === "red" ? 0.9 : 0.5 }}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                    onClick={() => handleVote("red")}
                    className="relative flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                    style={{ background: "linear-gradient(160deg,#1a0505,#3b0a0a)" }}>
                    <div className="text-4xl mb-2" style={{ animation: "spin 25s linear infinite reverse" }}>🌌</div>
                    <p className="text-red-300 font-bold">RED ZONE</p>
                    <p className="text-red-400/60 text-2xl font-mono font-black">{votes.redPercent}%</p>
                    {galaxySide === "red" && (
                      <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        onClick={e => { e.stopPropagation(); navigate("/galaxy"); }}
                        className="mt-3 px-5 py-2 bg-red-600/50 border border-red-400/60 rounded-2xl text-white text-sm">
                        🚀 Galaxie betreten
                      </motion.button>
                    )}
                  </motion.div>
                </div>
                <p className="text-center text-white/25 text-[10px] font-mono mb-4">{votes.total.toLocaleString()} Stimmen registriert</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={() => navigate("/galaxy")} className="px-6 py-2.5 bg-gradient-to-r from-blue-700/50 to-indigo-600/50 border border-blue-400/40 rounded-2xl text-white text-sm hover:from-blue-600/70 transition-all">🌌 3D-Galaxie (Three.js)</button>
                  <button onClick={() => navigate("/planet/earth")} className="px-6 py-2.5 bg-gradient-to-r from-emerald-700/50 to-teal-600/50 border border-emerald-400/40 rounded-2xl text-white text-sm hover:from-emerald-600/70 transition-all">🪐 Planetenwelt</button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Council Chat Modal */}
      {councilOpen && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setCouncilOpen(false)}>
          <div className="w-full max-h-[85vh] overflow-y-auto bg-background border-t border-border rounded-t-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-bold text-primary">👥 Q-Rat</span>
              <button onClick={() => setCouncilOpen(false)} className="text-muted-foreground text-xl">✕</button>
            </div>
            <CouncilChat />
          </div>
        </div>
      )}

      {/* SunCore Chat */}
      {sunOpen && (
        <SunCoreChatEnhanced open={sunOpen} onOpenChange={setSunOpen} />
      )}

    </div>
  );
}
