/**
 * SovereignHub — Private Command Center
 *
 * Accessible only via secret route /q-sovereign
 * Protected by passphrase gate — not listed in nav or sitemap.
 * Intended for deployment on a separate Q domain.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ACCESS_KEY = "Q.SOVEREIGN.2026"; // simple client-side gate

const SECTIONS = [
  { id: "galaxy",     label: "Galaxy Mode",         icon: "🌌", path: "/galaxy" },
  { id: "command",    label: "Command Center",       icon: "🛸", path: "/command-center" },
  { id: "empire",     label: "Empire Dashboard",     icon: "⚔️", path: "/empire" },
  { id: "suncore",    label: "Sun Core",             icon: "☀️", path: "/sun-core" },
  { id: "qcore",      label: "Q Core",               icon: "⚛️", path: "/q" },
  { id: "cmd",        label: "Forge Command",        icon: "📡", path: "/command" },
];

const STATS = [
  { label: "Build Status",   value: "✅ PASSING",    color: "text-emerald-400" },
  { label: "Lint",           value: "✅ CLEAN",      color: "text-emerald-400" },
  { label: "DUNS",           value: "487142097",    color: "text-cyan-400" },
  { label: "Registry",       value: "🇨🇭 Switzerland", color: "text-blue-300" },
];

export default function SovereignHub() {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const handleUnlock = () => {
    if (input === ACCESS_KEY) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
    setInput("");
  };

  if (!unlocked) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 p-10 bg-slate-950/90 border border-slate-700/50 rounded-3xl w-full max-w-sm mx-4"
        >
          <div className="text-center">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-white font-mono font-bold text-xl">Q.SOVEREIGN HUB</h1>
            <p className="text-slate-500 text-xs mt-1 font-mono">Private Access Only</p>
          </div>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Access Key..."
            className={[
              "w-full px-4 py-3 bg-black border rounded-xl font-mono text-sm text-white placeholder-slate-600 outline-none transition-all",
              error ? "border-red-500 animate-pulse" : "border-slate-700 focus:border-cyan-500",
            ].join(" ")}
          />
          <button
            onClick={handleUnlock}
            className="w-full py-3 bg-gradient-to-r from-cyan-700/60 to-blue-700/60 border border-cyan-500/40 rounded-xl text-white font-mono font-bold hover:from-cyan-600/70 hover:to-blue-600/70 transition-all"
          >
            UNLOCK
          </button>
          {error && <p className="text-red-400 text-xs font-mono">Access Denied</p>}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-cyan-500 tracking-[0.3em] mb-1">PRIVATE COMMAND</div>
            <h1 className="text-2xl md:text-3xl font-black">Q.SOVEREIGN HUB</h1>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 border border-white/20 rounded-xl text-white/50 hover:text-white hover:border-white/40 text-sm transition-all"
          >
            ← Main
          </button>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
      >
        {STATS.map((s) => (
          <div key={s.label} className="bg-slate-900/70 border border-slate-700/50 rounded-xl px-4 py-3">
            <div className="text-white/40 text-[11px] font-mono mb-1">{s.label}</div>
            <div className={`font-mono font-bold text-sm ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </motion.div>

      {/* Navigation grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
      >
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => navigate(s.path)}
            className="flex items-center gap-4 p-5 bg-slate-900/60 border border-slate-700/50 rounded-2xl hover:bg-slate-800/70 hover:border-cyan-500/40 transition-all text-left group"
          >
            <span className="text-3xl">{s.icon}</span>
            <div>
              <div className="font-semibold text-white group-hover:text-cyan-300 text-sm">{s.label}</div>
              <div className="text-white/30 text-[11px] font-mono">{s.path}</div>
            </div>
          </button>
        ))}
      </motion.div>

      {/* Contact & Credentials */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid md:grid-cols-2 gap-4"
      >
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5 space-y-3">
          <h3 className="text-white/60 text-xs font-mono tracking-widest mb-3">CONTACT</h3>
          {[
            { label: "metarix.ai@gmail.com",  icon: "✉️", href: "mailto:metarix.ai@gmail.com" },
            { label: "mshz.net77@gmail.com",  icon: "✉️", href: "mailto:mshz.net77@gmail.com" },
            { label: "+41 76 297 09 70",       icon: "💬", href: "https://wa.me/41762970970" },
          ].map((c) => (
            <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm text-cyan-300 hover:text-white transition-colors">
              <span>{c.icon}</span>{c.label}
            </a>
          ))}
        </div>
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5">
          <h3 className="text-white/60 text-xs font-mono tracking-widest mb-3">COMPANY</h3>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between"><span className="text-white/40">Country</span><span className="text-white">🇨🇭 Switzerland</span></div>
            <div className="flex justify-between"><span className="text-white/40">DUNS</span><span className="text-cyan-400 font-bold">487142097</span></div>
            <div className="flex justify-between"><span className="text-white/40">D&amp;B</span><span className="text-emerald-400">✓ Verified</span></div>
            <div className="flex justify-between"><span className="text-white/40">WhatsApp</span><span className="text-green-400">✓ Available</span></div>
          </div>
        </div>
      </motion.div>

      {/* Lock button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="mt-8 flex justify-end">
        <button onClick={() => setUnlocked(false)}
          className="px-5 py-2.5 border border-red-800/50 text-red-400 rounded-xl text-sm font-mono hover:bg-red-900/20 transition-all">
          🔒 Lock Session
        </button>
      </motion.div>
    </div>
  );
}
