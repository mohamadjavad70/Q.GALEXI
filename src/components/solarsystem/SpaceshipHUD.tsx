import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Eye, Play, Pause, Rocket, Orbit,
  Navigation, Radio, ChevronDown, ChevronUp,
  Lock, Terminal, Square, Volume2, VolumeX,
  Maximize2, Minimize2, Monitor, Copy, Check,
} from "lucide-react";
import { useAmbientPad } from "@/hooks/useAmbientPad";
import LanguagePicker from "@/components/LanguagePicker";
import { isOwnerUnlocked } from "@/lib/ownerGate";
import type { StarConfig } from "@/data/starRegistry";
import type { HUDSettings, HUDMode } from "@/hooks/useHUDSettings";
import type { NavMode, FlightTelemetry } from "./FlightCore";
import { getLedger, type LedgerEntry } from "@/lib/geneticHash";
import { getEmpireSnapshot } from "@/lib/empireStats";

/* ── helpers ── */
const speedPresets = [0.25, 1, 4, 16];
const G = "bg-card/20 backdrop-blur-xl border border-border/10 rounded-lg"; // glass

interface GroupedSignal {
  action: string;
  starSlug: string;
  hash: string;
  count: number;
  timestamp: number;
}

function groupLedger(entries: LedgerEntry[], limit = 20): GroupedSignal[] {
  const recent = entries.slice(-limit).reverse();
  const groups: GroupedSignal[] = [];
  const seen = new Map<string, number>(); // key → index in groups
  for (const e of recent) {
    const key = `${e.action}|${e.starSlug}`;
    const idx = seen.get(key);
    if (idx !== undefined) {
      groups[idx].count++;
    } else {
      seen.set(key, groups.length);
      groups.push({ action: e.action, starSlug: e.starSlug, hash: e.hash, count: 1, timestamp: e.timestamp });
    }
  }
  return groups.slice(0, 8);
}

/* ── Chip toggle ── */
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-[8px] font-medium border transition-all ${
        active
          ? "bg-primary/15 border-primary/30 text-primary"
          : "bg-card/10 border-border/10 text-muted-foreground/50 hover:text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/* ── Props ── */
interface SpaceshipHUDProps {
  settings: HUDSettings;
  onUpdate: (patch: Partial<HUDSettings>) => void;
  telemetry: FlightTelemetry;
  stars: StarConfig[];
  navMode: NavMode;
  autopilotName: string | null;
  focusedStar: StarConfig | null;
  timeScrub: number;
  onTimeScrub: (v: number) => void;
  onNavSubmit: (query: string) => void;
  onCancelAutopilot: () => void;
  onReleaseFocus: () => void;
  onQuickPlanet: (slug: string) => void;
  onEnterWorld: () => void;
  onToggleExplorer: () => void;
  onBrake: () => void;
}

export default function SpaceshipHUD({
  settings, onUpdate, telemetry, stars, navMode,
  autopilotName, focusedStar, timeScrub, onTimeScrub,
  onNavSubmit, onCancelAutopilot, onReleaseFocus,
  onQuickPlanet, onEnterWorld, onToggleExplorer, onBrake,
}: SpaceshipHUDProps) {
  const navigate = useNavigate();
  const [navQuery, setNavQuery] = useState("");
  const [signalsOpen, setSignalsOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const ownerMode = isOwnerUnlocked();
  const mode = settings.hudMode;
  const empire = getEmpireSnapshot();

  // Ambient pad
  const { started: padStarted, start: startPad } = useAmbientPad(settings.audioMuted);
  useEffect(() => {
    if (padStarted) return;
    const kick = () => { startPad(); };
    window.addEventListener("click", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
    return () => { window.removeEventListener("click", kick); window.removeEventListener("keydown", kick); };
  }, [padStarted, startPad]);

  // Keyboard: H = cinematic toggle, Tab = compact/expanded toggle, C = cancel autopilot
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === "h" && !e.ctrlKey && !e.metaKey) {
        onUpdate({ hudMode: mode === "CINEMATIC" ? "COMPACT" : "CINEMATIC" });
      }
      if (key === "tab" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (mode !== "CINEMATIC") {
          onUpdate({ hudMode: mode === "COMPACT" ? "EXPANDED" : "COMPACT" });
        }
      }
      if (key === "c" && navMode === "AUTOPILOT") {
        onCancelAutopilot();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, onUpdate, navMode, onCancelAutopilot]);

  const handleNavKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && navQuery.trim()) {
        onNavSubmit(navQuery.trim());
        setNavQuery("");
      }
    },
    [navQuery, onNavSubmit],
  );

  const copyHash = useCallback((hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1200);
  }, []);

  const signals = groupLedger(getLedger());

  const modeLabel = navMode === "FREE" ? "آزاد" : navMode === "AUTOPILOT" ? "اتوپایلوت" : "فوکوس";
  const modeLabelEn = navMode === "FREE" ? "FREE" : navMode === "AUTOPILOT" ? "AUTO" : "FOCUS";
  const expanded = mode === "EXPANDED";

  /* ── CINEMATIC ── */
  if (mode === "CINEMATIC") {
    return (
      <button
        onClick={() => onUpdate({ hudMode: "COMPACT" })}
        className="absolute top-3 right-3 z-20 pointer-events-auto bg-card/10 backdrop-blur-sm rounded-full p-2 border border-border/5 text-muted-foreground/30 hover:text-foreground/60 transition-colors"
        title="Show HUD (H)"
      >
        <Eye className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="absolute inset-0 z-20 pointer-events-none" dir="rtl">
      {/* ─── Top Bar ─── */}
      <div className="flex items-center justify-between px-3 py-2 md:px-4">
        <div className={`pointer-events-auto flex items-center gap-2 ${G} px-3 py-1`}>
          <span className="text-primary font-bold text-[10px] tracking-widest">Q</span>
          <span className="w-px h-3 bg-border/20" />
          <span className="text-foreground text-[9px] font-medium">{modeLabel}</span>
          <span className="text-muted-foreground/30 text-[7px]">{modeLabelEn}</span>
          {navMode === "AUTOPILOT" && autopilotName && (
            <Badge className="text-[7px] bg-accent/15 text-accent border-none px-1.5 py-0 ml-1">
              → {autopilotName}
              {telemetry.autopilotDist > 0 && (
                <span className="ml-1 text-muted-foreground/60">
                  {telemetry.autopilotDist.toFixed(0)}u
                  {telemetry.autopilotETA > 0 && ` ~${telemetry.autopilotETA.toFixed(0)}s`}
                </span>
              )}
            </Badge>
          )}
          <span className="w-px h-3 bg-border/20" />
          <span className="text-emerald-500/60 text-[7px]">●</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1">
          <LanguagePicker compact />
          {ownerMode ? (
            <button
              onClick={() => navigate("/command-center")}
              className={`${G} px-2 py-1 text-[8px] text-primary hover:text-foreground transition-colors flex items-center gap-1`}
              title="فرماندهی"
            >
              <Terminal className="w-2.5 h-2.5" />
              <span className="hidden md:inline">فرماندهی</span>
            </button>
          ) : (
            <span className={`${G} px-2 py-1 text-[8px] text-muted-foreground/25`} title="فقط برای فرمانده">
              <Lock className="w-2.5 h-2.5" />
            </span>
          )}
          {/* Mode toggles */}
          <button
            onClick={() => onUpdate({ hudMode: expanded ? "COMPACT" : "EXPANDED" })}
            className={`${G} p-1 text-muted-foreground/50 hover:text-foreground transition-colors`}
            title={expanded ? "Compact (Tab)" : "Expand (Tab)"}
          >
            {expanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          <button
            onClick={() => onUpdate({ hudMode: "CINEMATIC" })}
            className={`${G} p-1 text-muted-foreground/50 hover:text-foreground transition-colors`}
            title="Cinematic (H)"
          >
            <Monitor className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ─── Center Reticle ─── */}
      {navMode === "FREE" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative w-6 h-6">
            <div className="absolute inset-0 border border-primary/10 rounded-full" />
            <div className="absolute top-1/2 left-0 w-1 h-px bg-primary/20" />
            <div className="absolute top-1/2 right-0 w-1 h-px bg-primary/20" />
            <div className="absolute top-0 left-1/2 w-px h-1 bg-primary/20 -translate-x-px" />
            <div className="absolute bottom-0 left-1/2 w-px h-1 bg-primary/20 -translate-x-px" />
          </div>
        </div>
      )}

      {/* ─── Focused Planet Info ─── */}
      {navMode === "FOCUS" && focusedStar && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-14 pointer-events-none">
          <div className={`${G} px-5 py-3 text-center`}>
            <p className="text-foreground font-bold text-sm">{focusedStar.displayNameFa}</p>
            <p className="text-muted-foreground/50 text-[10px]">{focusedStar.displayNameEn}</p>
            <p className="text-muted-foreground text-[10px] mt-1">{focusedStar.missionFa}</p>
            <p className="text-muted-foreground/40 text-[8px]">{focusedStar.missionEn}</p>
          </div>
        </div>
      )}

      {/* ─── Bottom Area ─── */}
      <div className="absolute bottom-2 left-2 right-2 md:bottom-3 md:left-3 md:right-3 flex items-end justify-between gap-2">

        {/* ─── RIGHT: Telemetry + Controls ─── */}
        <div className={`pointer-events-auto ${G} p-2.5 space-y-2 min-w-[170px] max-w-[210px]`}>
          {/* Empire Integrity Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-primary/70 text-[8px] font-bold tracking-wide">EMPIRE</span>
              <span className={`font-mono text-[9px] font-bold ${empire.integrity > 70 ? "text-emerald-400" : "text-amber-400"}`}>
                {empire.integrity}%
              </span>
            </div>
            <div className="w-full h-1 bg-card/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${empire.integrity}%`,
                  background: empire.integrity > 70
                    ? "linear-gradient(90deg, hsl(var(--primary)), #10b981)"
                    : "linear-gradient(90deg, #f59e0b, #ef4444)",
                }}
              />
            </div>
            <div className="flex justify-between text-[7px] text-muted-foreground/40">
              <span>{empire.activeModules}/{empire.totalModules} ماژول</span>
              <span>{empire.readinessAvg}% آمادگی</span>
            </div>
          </div>

          {/* Compact telemetry */}
          <div className="flex items-center justify-between">
            <span className="text-primary/70 text-[8px] font-bold tracking-wide">تلمتری</span>
            <span className="text-foreground/80 font-mono text-[9px]">
              {telemetry.speed.toFixed(1)} <span className="text-muted-foreground/40">v</span>
            </span>
          </div>
          <div className="flex gap-3 text-[8px]">
            <span className="text-muted-foreground/50">h<span className="text-foreground/70 font-mono ml-0.5">{telemetry.altitude.toFixed(0)}</span></span>
            <span className="text-muted-foreground/50">x<span className="text-foreground/70 font-mono ml-0.5">{telemetry.position[0].toFixed(0)}</span></span>
            <span className="text-muted-foreground/50">z<span className="text-foreground/70 font-mono ml-0.5">{telemetry.position[2].toFixed(0)}</span></span>
          </div>

          {/* Expanded: Time controls + inertia */}
          {expanded && (
            <>
              <div className="border-t border-border/10 pt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-primary/70 text-[8px] font-bold">زمان مدار</span>
                  <Button variant="ghost" size="icon" className="h-4 w-4 text-foreground/60"
                    onClick={() => onUpdate({ paused: !settings.paused })}>
                    {settings.paused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                  </Button>
                </div>
                <div className="flex gap-0.5">
                  {speedPresets.map((s) => (
                    <button
                      key={s}
                      onClick={() => onUpdate({ timeSpeed: s })}
                      className={`flex-1 text-center py-0.5 rounded text-[7px] font-mono transition-colors ${
                        settings.timeSpeed === s
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground/40 hover:text-foreground/60"
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
                <Slider
                  value={[timeScrub]}
                  onValueChange={([v]) => onTimeScrub(v)}
                  min={-1000} max={1000} step={5}
                  className="w-full"
                />
              </div>
              <div className="border-t border-border/10 pt-1.5">
                <span className="text-muted-foreground/40 text-[7px]">اینرسی {(settings.inertia * 100).toFixed(0)}%</span>
                <Slider
                  value={[settings.inertia]}
                  onValueChange={([v]) => onUpdate({ inertia: v })}
                  min={0} max={1} step={0.05}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* Chip toggles */}
          <div className="flex flex-wrap gap-1">
            <Chip active={settings.showOrbits} onClick={() => onUpdate({ showOrbits: !settings.showOrbits })}>مدارها</Chip>
            <Chip active={settings.showLabels} onClick={() => onUpdate({ showLabels: !settings.showLabels })}>برچسب</Chip>
            <Chip active={settings.mouseLook} onClick={() => onUpdate({ mouseLook: !settings.mouseLook })}>نگاه</Chip>
            <Chip active={!settings.audioMuted} onClick={() => onUpdate({ audioMuted: !settings.audioMuted })}>
              {settings.audioMuted ? <VolumeX className="w-2 h-2 inline -mt-px" /> : <Volume2 className="w-2 h-2 inline -mt-px" />}
            </Chip>
          </div>

          {/* Action row */}
          <div className="flex gap-1">
            <button
              onClick={onToggleExplorer}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[8px] font-medium transition-colors ${
                navMode === "FREE" ? "bg-primary/15 text-primary" : "bg-card/15 text-muted-foreground/60"
              }`}
            >
              {navMode === "FREE" ? <Rocket className="w-2.5 h-2.5" /> : <Orbit className="w-2.5 h-2.5" />}
              {navMode === "FREE" ? "آزاد" : "اوربیت"}
            </button>
            <button
              onClick={onBrake}
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[8px] bg-card/15 text-muted-foreground/60 hover:text-foreground transition-colors"
              title="ترمز (Space)"
            >
              <Square className="w-2.5 h-2.5" /> ترمز
            </button>
          </div>
        </div>

        {/* ─── LEFT: Nav Console + Signals ─── */}
        <div className="pointer-events-auto space-y-1.5 min-w-[170px] max-w-[210px]">
          {/* Nav Console */}
          <div className={`${G} p-2.5 space-y-1.5`}>
            <div className="flex gap-1">
              <Input
                value={navQuery}
                onChange={(e) => setNavQuery(e.target.value)}
                placeholder="برو به سیاره..."
                className="text-[9px] h-5 bg-input/20 border-border/10 text-foreground placeholder:text-muted-foreground/30"
                dir="rtl"
                onKeyDown={handleNavKeyDown}
              />
              <Button size="sm" className="h-5 px-1.5 bg-primary/15 hover:bg-primary/25 border-none" onClick={() => {
                if (navQuery.trim()) { onNavSubmit(navQuery.trim()); setNavQuery(""); }
              }}>
                <Navigation className="w-2.5 h-2.5 text-primary" />
              </Button>
            </div>
            {navMode === "AUTOPILOT" && (
              <button className="w-full text-[8px] py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" onClick={onCancelAutopilot}>
                لغو اتوپایلوت (C)
              </button>
            )}
            {navMode === "FOCUS" && (
              <div className="flex gap-1">
                <button className="flex-1 text-[8px] py-1 rounded bg-card/15 text-muted-foreground hover:text-foreground transition-colors" onClick={onReleaseFocus}>
                  آزاد
                </button>
                <button className="flex-1 text-[8px] py-1 rounded bg-primary/15 text-primary hover:bg-primary/25 transition-colors" onClick={onEnterWorld}>
                  ورود ✦
                </button>
              </div>
            )}
            {/* Quick planet pills */}
            <div className="flex flex-wrap gap-0.5">
              {stars.slice(0, 7).map((s) => (
                <button
                  key={s.slug}
                  onClick={() => onQuickPlanet(s.slug)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-colors text-[7px] text-foreground/60 hover:text-foreground"
                  style={{ backgroundColor: `${s.chakraColor}15`, borderLeft: `2px solid ${s.chakraColor}40` }}
                >
                  {s.displayNameFa}
                </button>
              ))}
            </div>
          </div>

          {/* Signals (grouped) */}
          <div className={`${G} p-2.5`}>
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setSignalsOpen((v) => !v)}
            >
              <span className="text-primary/60 text-[8px] font-bold flex items-center gap-1">
                <Radio className="w-2.5 h-2.5" /> سیگنال‌ها
                {signals.length > 0 && (
                  <span className="bg-primary/10 text-primary/60 text-[7px] px-1 rounded-full">{signals.length}</span>
                )}
              </span>
              {signalsOpen ? <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/30" /> : <ChevronUp className="w-2.5 h-2.5 text-muted-foreground/30" />}
            </button>
            {signalsOpen && (
              <div className="mt-1.5 space-y-0.5">
                {signals.length === 0 && (
                  <p className="text-muted-foreground/30 text-[8px]">هنوز سیگنالی نیست</p>
                )}
                {signals.map((s, i) => (
                  <div key={i} className="flex items-center gap-1 text-[8px] group">
                    <span className="text-foreground/70 truncate flex-1">{s.action}</span>
                    {s.count > 1 && (
                      <span className="text-primary/40 text-[7px]">×{s.count}</span>
                    )}
                    <span className="text-muted-foreground/30 text-[7px] truncate max-w-[40px]">{s.starSlug}</span>
                    <button
                      onClick={() => copyHash(s.hash)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-foreground"
                      title={s.hash}
                    >
                      {copiedHash === s.hash ? <Check className="w-2 h-2 text-emerald-400" /> : <Copy className="w-2 h-2" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
