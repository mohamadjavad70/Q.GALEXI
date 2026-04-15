import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ─── Q Network Projects (backend-library references only) ─────────────────────
const Q_NETWORK_PROJECTS = [
  { id: "aiamir",    name: "Q.AIAMIR",       desc: "هوش مصنوعی تکاملی — Evolutionary AI Core",          tag: "AI" },
  { id: "q3",        name: "Q.NETWORK.Q3",   desc: "زیرساخت شبکه هوشمند نسل سوم",                       tag: "Network" },
  { id: "guardian",  name: "Q.GUARDIAN",     desc: "لایه امنیت و حفاظت سیستمی",                          tag: "Security" },
  { id: "agent",     name: "Q.AGENT",        desc: "عامل خودمختار هوشمند — Autonomous Agent Framework",  tag: "Agent" },
  { id: "genetic",   name: "Q.GENETIC",      desc: "موتور کد ژنتیک و تکامل الگوریتم",                    tag: "Engine" },
];

// ─── Blue side pages ──────────────────────────────────────────────────────────
const BLUE_PAGES = [
  { label: "Solar System",   path: "/",             icon: "🌍" },
  { label: "Command Center", path: "/command-center", icon: "🛸" },
  { label: "Empire",         path: "/empire",        icon: "⚔️" },
  { label: "Sun Core",       path: "/sun-core",      icon: "☀️" },
  { label: "Q Core",         path: "/q",             icon: "⚛️" },
  { label: "Command",        path: "/command",       icon: "📡" },
];

export default function Index() {
  const navigate = useNavigate();
  const [side, setSide] = useState<"blue" | "red" | null>(null);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      {/* ── Split layout ────────────────────────────────────────────────────── */}
      <div className="flex w-full h-full">

        {/* ── BLUE SIDE ─────────────────────────────────────────────────────── */}
        <motion.div
          className="relative flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
          animate={{ width: side === "red" ? "8%" : side === "blue" ? "92%" : "50%" }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          onClick={() => setSide(side === "blue" ? null : "blue")}
          style={{ background: "linear-gradient(160deg, #0a0f2e 0%, #0d1b4b 50%, #091630 100%)" }}
        >
          {/* Animated blue grid */}
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

          <AnimatePresence>
            {side !== "red" && (
              <motion.div
                key="blue-content"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="z-10 flex flex-col items-center gap-6 px-8"
              >
                <div className="text-center mb-2">
                  <div className="text-xs font-mono text-blue-400 tracking-[0.3em] mb-1">Q.GALEXI NETWORK</div>
                  <h2 className="text-3xl md:text-5xl font-black text-white">
                    <span className="text-blue-400">BLUE</span> ZONE
                  </h2>
                  <p className="text-blue-300/70 text-sm mt-2">تمام صفحات و مدل‌های Q</p>
                </div>

                {/* Page grid - only when expanded */}
                {side === "blue" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {BLUE_PAGES.map((p) => (
                      <button
                        key={p.path}
                        onClick={() => navigate(p.path)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-900/40 border border-blue-500/30 hover:bg-blue-800/60 hover:border-blue-400 transition-all text-left group"
                      >
                        <span className="text-2xl">{p.icon}</span>
                        <span className="text-sm font-medium text-blue-100 group-hover:text-white">{p.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* Bottom links - always visible */}
                <div className="flex gap-3 mt-2 flex-wrap justify-center" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setNetworkOpen(!networkOpen)}
                    className="px-4 py-2 text-xs border border-blue-500/40 rounded-full text-blue-300 hover:bg-blue-900/40 transition-all">
                    🌐 تازه‌های شبکه Q
                  </button>
                  <button onClick={() => setPartnerOpen(!partnerOpen)}
                    className="px-4 py-2 text-xs border border-blue-500/40 rounded-full text-blue-300 hover:bg-blue-900/40 transition-all">
                    🤝 همکاری با Q
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed label */}
          {side === "red" && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-blue-400 text-xs font-mono tracking-widest rotate-90 whitespace-nowrap">
              BLUE ZONE
            </motion.span>
          )}
        </motion.div>

        {/* ── Divider ─────────────────────────────────────────────────────────── */}
        <div className="w-px bg-gradient-to-b from-transparent via-white/30 to-transparent relative z-20 flex-shrink-0">
          <button
            onClick={() => setSide(null)}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 border border-white/30 hover:bg-white/20 transition-all flex items-center justify-center text-xs"
            title="بازگشت"
          >✦</button>
        </div>

        {/* ── RED SIDE ──────────────────────────────────────────────────────── */}
        <motion.div
          className="relative flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
          animate={{ width: side === "blue" ? "8%" : side === "red" ? "92%" : "50%" }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          onClick={() => setSide(side === "red" ? null : "red")}
          style={{ background: "linear-gradient(160deg, #1a0505 0%, #3b0a0a 50%, #200808 100%)" }}
        >
          {/* Red particle glow */}
          <div className="absolute inset-0 pointer-events-none opacity-30"
            style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(220,38,38,0.25) 0%, transparent 70%)" }} />

          <AnimatePresence>
            {side !== "blue" && (
              <motion.div
                key="red-content"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="z-10 flex flex-col items-center gap-8 px-8 text-center"
              >
                <div>
                  <div className="text-xs font-mono text-red-400 tracking-[0.3em] mb-1">IMMERSIVE 3D</div>
                  <h2 className="text-3xl md:text-5xl font-black text-white">
                    <span className="text-red-400">RED</span> ZONE
                  </h2>
                  <p className="text-red-300/70 text-sm mt-2">کهکشان سه‌بعدی — Galaxy Mode</p>
                </div>

                {side === "red" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-col items-center gap-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Galaxy preview visual */}
                    <div className="w-48 h-48 rounded-full border border-red-500/30 flex items-center justify-center relative"
                      style={{ background: "radial-gradient(circle, rgba(220,38,38,0.2) 0%, transparent 70%)" }}>
                      <span className="text-7xl animate-spin" style={{ animationDuration: "20s" }}>🌌</span>
                      <div className="absolute inset-0 rounded-full border border-red-500/20 animate-ping" style={{ animationDuration: "3s" }} />
                    </div>

                    <button
                      onClick={() => navigate("/galaxy")}
                      className="px-10 py-4 bg-gradient-to-r from-red-700/60 to-rose-600/60 border border-red-400 rounded-3xl text-white text-lg font-bold hover:from-red-600/80 hover:to-rose-500/80 active:scale-95 transition-all shadow-lg shadow-red-900/50"
                    >
                      🚀 ورود به کهکشان
                    </button>
                    <p className="text-red-400/60 text-xs font-mono">Three.js · GLSL Shaders · HRTF Audio</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {side === "blue" && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-red-400 text-xs font-mono tracking-widest rotate-90 whitespace-nowrap">
              RED ZONE
            </motion.span>
          )}
        </motion.div>
      </div>

      {/* ── Q Network News Panel ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {networkOpen && (
          <motion.div
            key="network-panel"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-t border-blue-500/30"
          >
            <div className="max-w-4xl mx-auto px-6 py-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-blue-300 font-mono font-bold text-lg">🌐 تازه‌های شبکه Q</h3>
                <button onClick={() => setNetworkOpen(false)} className="text-white/40 hover:text-white text-xl">✕</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Q_NETWORK_PROJECTS.map((p) => (
                  <div key={p.id} className="bg-blue-950/50 border border-blue-700/30 rounded-xl p-4 hover:border-blue-500/50 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-blue-800/60 text-blue-300 px-2 py-0.5 rounded-full font-mono">{p.tag}</span>
                      <span className="text-sm font-bold text-blue-100">{p.name}</span>
                    </div>
                    <p className="text-blue-300/60 text-xs leading-relaxed">{p.desc}</p>
                    <div className="mt-2 text-[10px] text-blue-500/50 font-mono">Q NETWORK • BACKEND MODULE</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Partnership Panel ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {partnerOpen && (
          <motion.div
            key="partner-panel"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-t border-cyan-500/30"
          >
            <div className="max-w-3xl mx-auto px-6 py-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-cyan-300 font-mono font-bold text-lg">🤝 همکاری با شبکه Q</h3>
                <button onClick={() => setPartnerOpen(false)} className="text-white/40 hover:text-white text-xl">✕</button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Contact info */}
                <div className="space-y-3">
                  <h4 className="text-white/70 text-xs font-mono tracking-widest">CONTACT & PARTNERSHIP</h4>
                  <a href="mailto:metarix.ai@gmail.com"
                    className="flex items-center gap-3 px-4 py-3 bg-cyan-900/30 border border-cyan-700/40 rounded-xl hover:border-cyan-400 transition-all group">
                    <span className="text-xl">✉️</span>
                    <div>
                      <div className="text-cyan-300 text-sm font-medium group-hover:text-white">metarix.ai@gmail.com</div>
                      <div className="text-white/40 text-xs">Primary Contact</div>
                    </div>
                  </a>
                  <a href="mailto:mshz.net77@gmail.com"
                    className="flex items-center gap-3 px-4 py-3 bg-cyan-900/30 border border-cyan-700/40 rounded-xl hover:border-cyan-400 transition-all group">
                    <span className="text-xl">✉️</span>
                    <div>
                      <div className="text-cyan-300 text-sm font-medium group-hover:text-white">mshz.net77@gmail.com</div>
                      <div className="text-white/40 text-xs">Secondary Contact</div>
                    </div>
                  </a>
                  <a href="https://wa.me/41762970970" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 bg-green-900/30 border border-green-700/40 rounded-xl hover:border-green-400 transition-all group">
                    <span className="text-xl">💬</span>
                    <div>
                      <div className="text-green-300 text-sm font-medium group-hover:text-white">+41 76 297 09 70</div>
                      <div className="text-white/40 text-xs">WhatsApp Available • Switzerland</div>
                    </div>
                  </a>
                </div>

                {/* Company credentials */}
                <div className="space-y-3">
                  <h4 className="text-white/70 text-xs font-mono tracking-widest">COMPANY CREDENTIALS</h4>
                  <div className="px-4 py-4 bg-slate-900/60 border border-slate-600/40 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇨🇭</span>
                      <span className="text-white/80 text-sm font-semibold">Registered in Switzerland</span>
                    </div>
                    <div className="flex flex-col gap-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-white/40">DUNS Number</span>
                        <span className="text-cyan-400 font-bold">487142097</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">D&B Verified</span>
                        <span className="text-emerald-400">✓ Active</span>
                      </div>
                    </div>
                    <p className="text-white/30 text-[11px] leading-relaxed pt-1 border-t border-white/10">
                      Q Network operates as a registered Swiss technology entity. All partnerships are governed by Swiss commercial law.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hint when nothing selected ──────────────────────────────────────── */}
      {side === null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-xs font-mono pointer-events-none text-center"
        >
          ← یک طرف را انتخاب کنید / Choose a side →
        </motion.div>
      )}
    </div>
  );
}

