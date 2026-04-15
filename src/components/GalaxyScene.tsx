import { Suspense, useState, useRef, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float, Html, OrbitControls } from "@react-three/drei";
import { getStarRegistry, starPositions } from "@/data/starRegistry";
import type { StarConfig } from "@/data/starRegistry";
import { useParallax } from "@/hooks/useParallax";
import ProceduralPlanet from "./galaxy/ProceduralPlanet";
import ParticleTrail from "./galaxy/ParticleTrail";
import InfiniteDepthShader from "./galaxy/InfiniteDepthShader";
import * as THREE from "three";

/* ─── Background Planets for depth ─── */
const bgPlanets: { pos: [number, number, number]; radius: number; base: string; accent: string; clouds: boolean }[] = [
  { pos: [-8, 4, -12], radius: 1.8, base: "#0a2a3a", accent: "#1a6080", clouds: true },
  { pos: [9, -3, -15], radius: 2.4, base: "#1a1a30", accent: "#4040aa", clouds: false },
  { pos: [-6, -5, -10], radius: 1.2, base: "#2a1a1a", accent: "#aa4040", clouds: true },
  { pos: [7, 5, -18], radius: 3.0, base: "#0a1a20", accent: "#206060", clouds: true },
];

/* ─── Parallax-aware scene container ─── */
function ParallaxScene({
  children,
  parallax,
}: {
  children: React.ReactNode;
  parallax: React.RefObject<{ pointerX: number; pointerY: number; scrollY: number; scrollProgress: number }>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current || !parallax.current) return;
    const { pointerX, pointerY } = parallax.current;
    // Smooth lerp camera group toward pointer
    const targetX = pointerX * 0.8;
    const targetY = -pointerY * 0.5;
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * delta * 2;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * delta * 2;
  });

  return <group ref={groupRef}>{children}</group>;
}

/* ─── Interactive Star Sphere ─── */
interface StarSphereProps {
  star: StarConfig;
  position: [number, number, number];
  onClick: () => void;
  isHovered: boolean;
  isWarping: boolean;
  onHover: (s: StarConfig | null) => void;
}

function StarSphere({ star, position, onClick, isHovered, isWarping, onHover }: StarSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseScale = star.bgStyle === "placeholder" ? 0.3 : 0.45;
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const warpTarget = isWarping ? baseScale * 2.5 : isHovered ? baseScale * 1.4 : baseScale;
    meshRef.current.scale.lerp(new THREE.Vector3(warpTarget, warpTarget, warpTarget), delta * 6);

    if (lightRef.current) {
      const targetIntensity = isWarping ? 8 : isHovered ? 3 : 1;
      lightRef.current.intensity += (targetIntensity - lightRef.current.intensity) * delta * 5;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
      <group position={position}>
        {/* Core sphere */}
        <mesh
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onPointerOver={(e) => { e.stopPropagation(); onHover(star); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { onHover(null); document.body.style.cursor = "auto"; }}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color={star.chakraColor}
            emissive={star.chakraColor}
            emissiveIntensity={isWarping ? 4 : isHovered ? 2.5 : 1.2}
            transparent
            opacity={star.bgStyle === "placeholder" ? 0.5 : 0.9}
          />
        </mesh>

        {/* Atmosphere fresnel glow */}
        <mesh>
          <sphereGeometry args={[1.25, 24, 24]} />
          <meshBasicMaterial
            color={star.chakraColor}
            transparent
            opacity={isHovered ? 0.15 : 0.06}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <pointLight ref={lightRef} color={star.chakraColor} intensity={1} distance={6} />

        <Html center position={[0, 1.4, 0]} style={{ pointerEvents: "none" }}>
          <div className="text-center whitespace-nowrap select-none">
            <p className="text-foreground text-sm font-bold drop-shadow-lg">{star.displayNameFa}</p>
            <p className="text-muted-foreground text-[10px]">{star.displayNameEn}</p>
          </div>
        </Html>
      </group>
    </Float>
  );
}

/* ─── Main Galaxy Scene ─── */
interface GalaxySceneProps {
  onStarClick: (slug: string, chakraColor: string) => void;
}

export default function GalaxyScene({ onStarClick }: GalaxySceneProps) {
  const [hovered, setHovered] = useState<StarConfig | null>(null);
  const [warpingSlug, setWarpingSlug] = useState<string | null>(null);
  const [burstSlug, setBurstSlug] = useState<string | null>(null);
  const stars = getStarRegistry();
  const parallax = useParallax();

  const handleStarClick = useCallback((star: StarConfig) => {
    if (warpingSlug) return;
    setWarpingSlug(star.slug);
    setBurstSlug(star.slug);

    // Delay navigation to let warp overlay play
    setTimeout(() => {
      onStarClick(star.slug, star.chakraColor);
    }, 850);
  }, [warpingSlug, onStarClick]);

  return (
    <div className="relative w-full h-full">
      <Canvas camera={{ position: [0, 0, 14], fov: 55 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          {/* Infinite depth shader background */}
          <InfiniteDepthShader layers={6} density={5} color="#4060aa" />
          
          <ambientLight intensity={0.12} />
          <pointLight position={[10, 10, 10]} intensity={0.25} />
          <pointLight position={[-8, -5, 5]} intensity={0.1} color="#4060aa" />
          {/* NASA deep-field multi-layer stars */}
          <Stars radius={250} depth={180} count={8000} factor={5} saturation={0.15} fade speed={0.2} />
          <Stars radius={120} depth={80}  count={4000} factor={3} saturation={0.3}  fade speed={0.4} />
          <Stars radius={40}  depth={30}  count={2000} factor={2} saturation={0.5}  fade speed={0.6} />

          <OrbitControls
            autoRotate
            autoRotateSpeed={0.25}
            enableZoom={true}
            minDistance={5}
            maxDistance={50}
            enablePan={false}
            maxPolarAngle={Math.PI * 0.7}
            minPolarAngle={Math.PI * 0.3}
          />

          <ParallaxScene parallax={parallax}>
            {/* Background procedural planets */}
            {bgPlanets.map((p, i) => (
              <ProceduralPlanet
                key={`bg-planet-${i}`}
                position={p.pos}
                radius={p.radius}
                baseColor={p.base}
                accentColor={p.accent}
                showClouds={p.clouds}
                rotationSpeed={0.03 + i * 0.01}
                atmosphereIntensity={0.6}
              />
            ))}

            {/* Interactive star portals */}
            {stars.map((star, i) => {
              const pos = starPositions[i] || [0, 0, 0];
              return (
                <group key={star.slug}>
                  <StarSphere
                    star={star}
                    position={pos}
                    onClick={() => handleStarClick(star)}
                    isHovered={hovered?.slug === star.slug}
                    isWarping={warpingSlug === star.slug}
                    onHover={setHovered}
                  />
                  <ParticleTrail
                    emitPosition={new THREE.Vector3(...pos)}
                    active={hovered?.slug === star.slug}
                    burst={burstSlug === star.slug}
                    color={star.chakraColor}
                    onBurstDone={() => {
                      if (burstSlug === star.slug) setBurstSlug(null);
                    }}
                  />
                </group>
              );
            })}
          </ParallaxScene>
        </Suspense>
      </Canvas>

      {/* Hover tooltip */}
      {hovered && !warpingSlug && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-md rounded-xl px-5 py-3 text-center border border-border pointer-events-none">
          <p className="text-foreground font-bold text-base">{hovered.displayNameFa}</p>
          <p className="text-muted-foreground text-sm">{hovered.missionFa}</p>
          <p className="text-muted-foreground text-xs mt-1">{hovered.missionEn}</p>
        </div>
      )}
    </div>
  );
}
