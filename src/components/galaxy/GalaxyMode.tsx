/**
 * GalaxyMode — Advanced Procedural Galaxy Scene
 * Mobile-adaptive | Custom Shaders | Star Selection | HRTF-Ready
 *
 * Stack: @react-three/fiber + @react-three/drei + three.js
 * No external post-processing required — additive blending provides natural glow.
 */
import React, {
  Suspense,
  useRef,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// ─── Device Detection ────────────────────────────────────────────────────────

const isMobileDevice = (): boolean =>
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;

function getQualitySettings() {
  const mobile = isMobileDevice();
  const lowEnd = mobile && (navigator.hardwareConcurrency ?? 4) < 4;
  return {
    particleCount: mobile ? (lowEnd ? 6500 : 11000) : 18000,
    rotationSpeed: mobile ? 0.004 : 0.008,
    antialias: !mobile,
    pixelRatio: Math.min(window.devicePixelRatio, mobile ? 1.5 : 2),
    starsCount: mobile ? 400 : 700,
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface StarInfo {
  index: number;
  position: THREE.Vector3;
  name: string;
  status: string;
}

interface GalaxyModeProps {
  onStarSelect?: (star: StarInfo) => void;
  onSync?: () => void;
}

// ─── Vertex & Fragment Shaders ────────────────────────────────────────────────

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uSize;
  attribute float size;
  varying vec3 vColor;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * uSize * (280.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = (1.0 - dist * 1.6) * 0.95;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// ─── Galaxy Particles ─────────────────────────────────────────────────────────

interface GalaxyParticlesProps {
  particleCount: number;
  rotationSpeed: number;
  onStarSelect: (star: StarInfo) => void;
}

const GalaxyParticles = React.memo(
  ({ particleCount, rotationSpeed, onStarSelect }: GalaxyParticlesProps) => {
    const pointsRef = useRef<THREE.Points>(null!);
    const materialRef = useRef<THREE.ShaderMaterial>(null!);

    const uniforms = useMemo(
      () => ({
        uTime: { value: 0 },
        uSize: { value: isMobileDevice() ? 0.9 : 1.25 },
      }),
      []
    );

    const { positions, colors, sizes } = useMemo(() => {
      const pos = new Float32Array(particleCount * 3);
      const col = new Float32Array(particleCount * 3);
      const siz = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const radius = Math.random() * 82 + 15;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1) * 0.55;

        pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
        pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.16;
        pos[i3 + 2] = radius * Math.cos(phi) * 0.65;

        const hue = Math.random();
        col[i3] = hue > 0.5 ? 0.6 : 0.2;
        col[i3 + 1] = hue > 0.6 ? 0.7 : 0.4;
        col[i3 + 2] = 1.0;

        siz[i] = Math.random() * 2.4 + 0.8;
      }

      return { positions: pos, colors: col, sizes: siz };
    }, [particleCount]);

    useFrame((state) => {
      if (pointsRef.current) {
        pointsRef.current.rotation.y =
          state.clock.getElapsedTime() * rotationSpeed;
      }
      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value =
          state.clock.getElapsedTime();
      }
    });

    const handlePointerDown = useCallback(
      (e: { stopPropagation?: () => void; index?: number; intersections?: Array<{ index?: number }> }) => {
        e.stopPropagation?.();
        const idx =
          e.index ?? e.intersections?.[0]?.index ?? null;
        if (idx == null) return;

        const i3 = idx * 3;
        const pos = new THREE.Vector3(
          positions[i3] ?? 0,
          positions[i3 + 1] ?? 0,
          positions[i3 + 2] ?? 0
        );

        onStarSelect({
          index: idx,
          position: pos,
          name: `Star System ${idx}`,
          status: Math.random() > 0.5 ? 'STABLE' : 'ACTIVE',
        });

        if (navigator.vibrate) navigator.vibrate(40);
      },
      [onStarSelect, positions]
    );

    return (
      <points ref={pointsRef} onPointerDown={handlePointerDown}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={sizes.length}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          attach="material"
          uniforms={uniforms}
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    );
  }
);

GalaxyParticles.displayName = 'GalaxyParticles';

// ─── Scene ────────────────────────────────────────────────────────────────────

interface SceneProps {
  quality: ReturnType<typeof getQualitySettings>;
  onStarSelect: (star: StarInfo) => void;
}

function GalaxyScene({ quality, onStarSelect }: SceneProps) {
  const mobile = isMobileDevice();

  return (
    <>
      <ambientLight intensity={mobile ? 0.35 : 0.25} />
      <pointLight
        position={[40, 60, 50]}
        intensity={1.8}
        color="#88ccff"
      />

      <GalaxyParticles
        particleCount={quality.particleCount}
        rotationSpeed={quality.rotationSpeed}
        onStarSelect={onStarSelect}
      />

      <Stars
        radius={140}
        depth={50}
        count={quality.starsCount}
        factor={5}
        saturation={0}
        fade
      />

      <OrbitControls
        enableDamping
        dampingFactor={mobile ? 0.14 : 0.09}
        enableZoom
        enableRotate
        enablePan
        minDistance={18}
        maxDistance={220}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GalaxyMode({ onStarSelect, onSync }: GalaxyModeProps) {
  const [quality] = useState(getQualitySettings);
  const [selectedStar, setSelectedStar] = useState<StarInfo | null>(null);
  const [planetPrompt, setPlanetPrompt] = useState('');
  const [planetStatus, setPlanetStatus] = useState<'idle' | 'creating' | 'done' | 'error'>('idle');
  const [createdPlanetId, setCreatedPlanetId] = useState<string | null>(null);
  const mobile = isMobileDevice();

  const handleStarSelect = useCallback(
    (star: StarInfo) => {
      setSelectedStar(star);
      onStarSelect?.(star);
    },
    [onStarSelect]
  );

  const handleCreatePlanet = useCallback(async () => {
    if (!planetPrompt.trim()) return;
    setPlanetStatus('creating');
    try {
      // Dynamic import — keeps main bundle lean
      const { createPlanet } = await import('@/lib/planetApi');
      const planet = await createPlanet({ userId: 'user-local', prompt: planetPrompt });
      setCreatedPlanetId(planet.id);
      setPlanetStatus('done');
      setPlanetPrompt('');
    } catch {
      setPlanetStatus('error');
    }
    setTimeout(() => setPlanetStatus('idle'), 3000);
  }, [planetPrompt]);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden touch-manipulation select-none">
      <Canvas
        camera={{ position: [0, 32, 88], fov: mobile ? 55 : 48, near: 1, far: 400 }}
        gl={{
          antialias: quality.antialias,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        }}
        dpr={Math.min(window.devicePixelRatio, mobile ? 1 : 2)}
        performance={{ min: 0.65 }}
      >
        <Suspense fallback={null}>
          <GalaxyScene quality={quality} onStarSelect={handleStarSelect} />
        </Suspense>
      </Canvas>

      {/* ── HUD ── */}
      <div className="absolute top-4 left-4 right-4 pointer-events-none">
        <div className="inline-block backdrop-blur-2xl bg-black/70 px-5 py-4 rounded-3xl border border-white/10 text-white font-mono">
          <div className="text-cyan-400 text-lg tracking-widest">
            🌌 Q.GALEXI • GALAXY MODE
          </div>
          <div className="text-emerald-400 text-xs mt-1">
            SUNCORE STABLE • EMPIRE LINK 99.97% •{' '}
            {mobile ? 'MOBILE OPTIMIZED' : 'HIGH QUALITY'}
          </div>
          <div className="text-amber-400 text-xs">FLIGHTCORE: NOMINAL</div>
        </div>
      </div>

      {/* ── Star Info Panel ── */}
      {selectedStar && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-3xl border border-cyan-400/60 rounded-3xl p-6 text-white text-center pointer-events-auto min-w-[260px]">
          <div className="text-cyan-400 text-xl mb-1">✦ {selectedStar.name}</div>
          <div
            className={`text-sm ${
              selectedStar.status === 'STABLE'
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            Status: {selectedStar.status}
          </div>
          <div className="text-gray-500 text-xs mt-1">
            #{selectedStar.index}
          </div>
          <button
            onClick={() => setSelectedStar(null)}
            className="mt-4 px-7 py-2.5 bg-white/10 hover:bg-white/20 active:bg-red-500/20 rounded-full text-sm transition-all"
          >
            RETURN TO GALAXY
          </button>
        </div>
      )}

      {/* ── Create Planet Panel ── */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 pointer-events-auto">
        <div className="bg-black/80 backdrop-blur-2xl border border-white/15 rounded-2xl p-4 flex gap-2">
          <input
            type="text"
            value={planetPrompt}
            onChange={(e) => setPlanetPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePlanet()}
            placeholder={mobile ? 'سیاره جدید...' : 'بگو چه نوع سیاره‌ای می‌خوای...'}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
          />
          <button
            onClick={handleCreatePlanet}
            disabled={!planetPrompt.trim() || planetStatus === 'creating'}
            className="px-4 py-1.5 bg-cyan-600/40 border border-cyan-500/50 rounded-xl text-white text-xs hover:bg-cyan-500/50 disabled:opacity-40 transition-all"
          >
            {planetStatus === 'creating' ? '⏳' : planetStatus === 'done' ? '✅' : '🪐 بساز'}
          </button>
        </div>
        {planetStatus === 'done' && createdPlanetId && (
          <div className="text-emerald-400 text-xs font-mono text-center mt-1">
            سیاره ساخته شد — ID: {createdPlanetId.slice(0, 8)}
          </div>
        )}
        {planetStatus === 'error' && (
          <div className="text-red-400 text-xs font-mono text-center mt-1">
            API در دسترس نیست — سرور بک‌اند را اجرا کنید
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-auto">
        <button
          onClick={onSync}
          className="px-7 py-3 bg-white/5 hover:bg-white/15 border border-white/30 hover:border-cyan-400 active:border-cyan-400 rounded-2xl text-white text-sm transition-all active:scale-95"
        >
          SYNC WITH CORE
        </button>
      </div>

      {/* ── Touch Hint ── */}
      <div className="absolute bottom-[6rem] right-4 text-white/30 text-[10px] font-mono pointer-events-none text-right">
        {mobile
          ? 'PINCH زوم • SWIPE چرخش • TAP ستاره'
          : 'DRAG • SCROLL • CLICK STAR'}
      </div>
    </div>
  );
}
