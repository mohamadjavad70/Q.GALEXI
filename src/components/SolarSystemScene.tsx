import { Suspense, useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { getStarRegistry } from "@/data/starRegistry";
import type { StarConfig } from "@/data/starRegistry";
import { getLedger, logAction } from "@/lib/geneticHash";
import { getPlanetSeeds } from "@/lib/planetSeeds";
import { useHUDSettings } from "@/hooks/useHUDSettings";
import FlightCore from "./solarsystem/FlightCore";
import type { NavMode, FlightTelemetry } from "./solarsystem/FlightCore";
import QSun from "./solarsystem/QSun";
import OrbitingPlanet from "./solarsystem/OrbitingPlanet";
import OrbitRing from "./solarsystem/OrbitRing";
import UserPlanetOrb from "./solarsystem/UserPlanetOrb";
import SpaceshipHUD from "./solarsystem/SpaceshipHUD";
import MobileFlightControls from "./solarsystem/MobileFlightControls";
import QGateModal from "./solarsystem/QGateModal";
import PlanetSeedPanel from "./solarsystem/PlanetSeedPanel";
import WarpOverlay from "./galaxy/WarpOverlay";
import type { PlanetSeed } from "./solarsystem/UserPlanetOrb";
import { emitGolGolabEvent } from "./ChatOverlay";

/* ─── Elliptical orbit configs for 7 planets ─── */
const orbitConfigs = [
  { radiusX: 5, radiusZ: 4.3, speed: 0.35, offset: 0, pRadius: 0.45 },
  { radiusX: 7.5, radiusZ: 6.8, speed: 0.25, offset: 1.2, pRadius: 0.5 },
  { radiusX: 10, radiusZ: 9.2, speed: 0.2, offset: 2.5, pRadius: 0.55 },
  { radiusX: 12.5, radiusZ: 11.5, speed: 0.15, offset: 3.8, pRadius: 0.4 },
  { radiusX: 15, radiusZ: 13.8, speed: 0.12, offset: 5.0, pRadius: 0.48 },
  { radiusX: 17.5, radiusZ: 16.5, speed: 0.1, offset: 0.8, pRadius: 0.3 },
  { radiusX: 20, radiusZ: 18.5, speed: 0.08, offset: 4.2, pRadius: 0.3 },
];
const USER_ORBIT_RX = 24;
const USER_ORBIT_RZ = 22;

/* ─── TimeDriver ─── */
function TimeDriver({ timeScale, timeRef }: { timeScale: number; timeRef: React.MutableRefObject<number> }) {
  useFrame((_, delta) => { timeRef.current += delta * timeScale; });
  return null;
}

/* ─── Main Scene ─── */
interface SolarSystemSceneProps {
  onNavigate: (path: string, chakraColor?: string) => void;
  onSunClick?: () => void;
}

export default function SolarSystemScene({ onNavigate, onSunClick }: SolarSystemSceneProps) {
  const stars = useMemo(() => getStarRegistry(), []);
  const { settings, update: updateSettings } = useHUDSettings();

  // Shared refs
  const keysRef = useRef<Set<string>>(new Set());
  const globalTimeRef = useRef(0);
  const defaultTelemetry: FlightTelemetry = {
    speed: 0, position: [0, 12, 25], altitude: 12,
    navMode: "FREE", autopilotTarget: null, autopilotDist: 0, autopilotETA: 0,
  };
  const telemetryRef = useRef<FlightTelemetry>(defaultTelemetry);
  const planetPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map());

  // Planet radii map for safety rails
  const planetRadii = useMemo(() => {
    const m = new Map<string, number>();
    stars.forEach((s, i) => {
      const cfg = orbitConfigs[i];
      if (cfg) m.set(s.slug, cfg.pRadius);
    });
    return m;
  }, [stars]);

  // State
  const [navMode, setNavMode] = useState<NavMode>("FREE");
  const [focusSlug, setFocusSlug] = useState<string | null>(null);
  const [autopilotSlug, setAutopilotSlug] = useState<string | null>(null);
  const [hovered, setHovered] = useState<StarConfig | null>(null);
  const [warpState, setWarpState] = useState({ active: false, color: "#00d4ff", path: "" });
  const [timeScrub, setTimeScrub] = useState(0);
  const [telemetrySnapshot, setTelemetrySnapshot] = useState<FlightTelemetry>(defaultTelemetry);
  const [seedPanel, setSeedPanel] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<PlanetSeed | null>(null);
  const [qGate, setQGate] = useState<{ open: boolean; purpose: "q-core" | "planet-seed"; callback: () => void }>({ open: false, purpose: "q-core", callback: () => {} });
  const [gateCleared, setGateCleared] = useState(false);
  const [seedsVersion, setSeedsVersion] = useState(0);
  const [seeds, setSeeds] = useState<PlanetSeed[]>(() => getPlanetSeeds());

  const focusedStar = focusSlug ? stars.find((s) => s.slug === focusSlug) || null : null;
  const autopilotName = autopilotSlug ? stars.find((s) => s.slug === autopilotSlug)?.displayNameFa || null : null;
  const effectiveTimeScale = settings.paused ? 0 : settings.timeSpeed;

  // Telemetry polling
  useEffect(() => {
    const id = setInterval(() => setTelemetrySnapshot({ ...telemetryRef.current }), 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setSeeds(getPlanetSeeds());
  }, [seedsVersion]);

  /* ─── Handlers ─── */
  const handlePlanetClick = useCallback((star: StarConfig) => {
    setNavMode("FOCUS");
    setFocusSlug(star.slug);
    setAutopilotSlug(null);
    logAction("mode_focus", star.slug);
    emitGolGolabEvent("first_planet_focus");
  }, []);

  const handleSunClick = useCallback(() => {
    if (onSunClick) {
      onSunClick();
    } else {
      setWarpState({ active: true, color: "#ffd700", path: "/q" });
    }
    emitGolGolabEvent("enter_qcore");
  }, [onSunClick]);

  const handleWarpComplete = useCallback(() => {
    onNavigate(warpState.path, warpState.color);
  }, [onNavigate, warpState]);

  const handleNavSubmit = useCallback((query: string) => {
    const q = query.toLowerCase();
    const target = stars.find((s) =>
      s.slug === q ||
      s.displayNameEn.toLowerCase().includes(q) ||
      s.displayNameFa.includes(query)
    );
    if (target && planetPositionsRef.current.has(target.slug)) {
      setAutopilotSlug(target.slug);
      setNavMode("AUTOPILOT");
      logAction("autopilot_target_set", target.slug);
      emitGolGolabEvent("first_autopilot");
    }
  }, [stars]);

  const handleAutopilotDock = useCallback((slug: string) => {
    setNavMode("FOCUS");
    setFocusSlug(slug);
    setAutopilotSlug(null);
    logAction("autopilot_dock", slug);
  }, []);

  const handleCancelAutopilot = useCallback(() => {
    setAutopilotSlug(null);
    setNavMode("FREE");
    logAction("autopilot_cancel", "system");
  }, []);

  const handleReleaseFocus = useCallback(() => {
    setFocusSlug(null);
    setNavMode("FREE");
    logAction("mode_free", "system");
  }, []);

  const handleEnterWorld = useCallback(() => {
    if (focusedStar) {
      setWarpState({ active: true, color: focusedStar.chakraColor, path: `/star/${focusedStar.slug}` });
      logAction("enter_world", focusedStar.slug);
    }
  }, [focusedStar]);

  const handleToggleExplorer = useCallback(() => {
    if (navMode === "FREE") {
      setNavMode("FOCUS");
      setFocusSlug(null);
    } else {
      setNavMode("FREE");
      setFocusSlug(null);
      setAutopilotSlug(null);
      logAction("mode_free", "system");
    }
  }, [navMode]);

  const handleQuickPlanet = useCallback((slug: string) => {
    if (planetPositionsRef.current.has(slug)) {
      setAutopilotSlug(slug);
      setNavMode("AUTOPILOT");
      logAction("autopilot_target_set", slug);
    }
  }, []);

  const handleBrake = useCallback(() => {
    logAction("flight_brake", "system");
  }, []);

  const handleGatePass = useCallback(() => {
    setGateCleared(true);
    setQGate((g) => ({ ...g, open: false }));
    qGate.callback();
  }, [qGate]);

  const handleSeedGateRequest = useCallback(() => {
    setQGate({
      open: true,
      purpose: "planet-seed",
      callback: () => { setGateCleared(true); },
    });
  }, []);

  return (
    <div className="relative w-full h-full">
      <Canvas camera={{ position: [0, 12, 25], fov: 55 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.08} />
          {/* NASA-scale deep field: multiple star layers for depth */}
          <Stars radius={300} depth={200} count={8000} factor={6} saturation={0.15} fade speed={0.15} />
          <Stars radius={150} depth={100} count={4000} factor={3} saturation={0.3} fade speed={0.3} />
          <Stars radius={50}  depth={40}  count={2000} factor={2} saturation={0.5} fade speed={0.5} />

          <TimeDriver timeScale={effectiveTimeScale} timeRef={globalTimeRef} />

          {/* Unified FlightCore — handles all 3 modes */}
          <FlightCore
            navMode={navMode}
            mouseLook={settings.mouseLook}
            inertia={settings.inertia}
            keysRef={keysRef}
            telemetryRef={telemetryRef}
            planetPositionsRef={planetPositionsRef}
            planetRadii={planetRadii}
            focusSlug={focusSlug}
            autopilotSlug={autopilotSlug}
            onAutopilotDock={handleAutopilotDock}
            onBrake={handleBrake}
          />

          {/* Q Sun */}
          <QSun ledgerCount={getLedger().length} onClick={handleSunClick} />

          {/* Orbit rings */}
          {settings.showOrbits && orbitConfigs.map((o, i) => (
            <OrbitRing
              key={`orbit-${i}`}
              radiusX={o.radiusX}
              radiusZ={o.radiusZ}
              color={stars[i]?.chakraColor || "#444"}
              opacity={0.07}
            />
          ))}
          {settings.showOrbits && seeds.length > 0 && (
            <OrbitRing radiusX={USER_ORBIT_RX} radiusZ={USER_ORBIT_RZ} color="#ffffff" opacity={0.03} />
          )}

          {/* 7 orbiting planets */}
          {stars.map((star, i) => {
            const cfg = orbitConfigs[i];
            if (!cfg) return null;
            return (
              <OrbitingPlanet
                key={star.slug}
                star={star}
                orbitRadiusX={cfg.radiusX}
                orbitRadiusZ={cfg.radiusZ}
                orbitSpeed={cfg.speed}
                orbitOffset={cfg.offset}
                globalTimeRef={globalTimeRef}
                timeScrub={timeScrub}
                planetRadius={cfg.pRadius}
                showLabel={settings.showLabels}
                onClick={() => handlePlanetClick(star)}
                isHovered={hovered?.slug === star.slug}
                onHover={setHovered}
                planetPositionsRef={planetPositionsRef}
              />
            );
          })}

          {/* User planet seeds */}
          {seeds.map((seed, i) => (
            <UserPlanetOrb
              key={seed.id}
              seed={seed}
              orbitRadius={USER_ORBIT_RX}
              orbitOffset={(i / Math.max(seeds.length, 1)) * Math.PI * 2}
              timeScale={effectiveTimeScale}
              onClick={() => { setSelectedSeed(seed); setSeedPanel(true); }}
            />
          ))}
        </Suspense>
      </Canvas>

      {/* Glass Cockpit HUD */}
      <SpaceshipHUD
        settings={settings}
        onUpdate={updateSettings}
        telemetry={telemetrySnapshot}
        stars={stars}
        navMode={navMode}
        autopilotName={autopilotName}
        focusedStar={focusedStar}
        timeScrub={timeScrub}
        onTimeScrub={setTimeScrub}
        onNavSubmit={handleNavSubmit}
        onCancelAutopilot={handleCancelAutopilot}
        onReleaseFocus={handleReleaseFocus}
        onQuickPlanet={handleQuickPlanet}
        onEnterWorld={handleEnterWorld}
        onToggleExplorer={handleToggleExplorer}
        onBrake={handleBrake}
      />

      {/* Mobile flight controls */}
      <MobileFlightControls keysRef={keysRef} visible={navMode === "FREE"} />

      {/* Hover tooltip */}
      {hovered && !warpState.active && navMode !== "FOCUS" && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-md rounded-xl px-5 py-3 text-center border border-border/20 pointer-events-none z-10">
          <p className="text-foreground font-bold text-base">{hovered.displayNameFa}</p>
          <p className="text-muted-foreground text-sm">{hovered.missionFa}</p>
          <p className="text-muted-foreground text-xs mt-1">{hovered.missionEn}</p>
        </div>
      )}

      {/* Planet seed panel */}
      <button
        className="absolute bottom-6 right-6 z-20 bg-card/60 backdrop-blur-md border border-border/20 rounded-full px-4 py-2 text-foreground text-xs font-medium hover:bg-card/80 transition-colors"
        onClick={() => setSeedPanel((v) => !v)}
      >
        🌱 سیاره‌ها
      </button>

      <PlanetSeedPanel
        open={seedPanel}
        onClose={() => setSeedPanel(false)}
        onRefresh={() => setSeedsVersion((v) => v + 1)}
        selectedSeed={selectedSeed}
        onRequestGate={handleSeedGateRequest}
        gateCleared={gateCleared}
      />

      <QGateModal
        open={qGate.open}
        purpose={qGate.purpose}
        onClose={() => setQGate((g) => ({ ...g, open: false }))}
        onPass={handleGatePass}
      />

      <WarpOverlay
        active={warpState.active}
        chakraColor={warpState.color}
        onComplete={handleWarpComplete}
      />
    </div>
  );
}
