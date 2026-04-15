import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import ProceduralPlanet from "@/components/galaxy/ProceduralPlanet";
import type { StarConfig } from "@/data/starRegistry";

/**
 * OrbitingPlanet — Elliptical orbit, reports position to shared map.
 */

interface OrbitingPlanetProps {
  star: StarConfig;
  orbitRadiusX: number;
  orbitRadiusZ: number;
  orbitSpeed: number;
  orbitOffset: number;
  globalTimeRef: React.MutableRefObject<number>;
  timeScrub: number;
  planetRadius: number;
  showLabel: boolean;
  onClick: () => void;
  isHovered: boolean;
  onHover: (star: StarConfig | null) => void;
  planetPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>;
}

function getColors(star: StarConfig) {
  const base: Record<string, { base: string; accent: string; clouds: boolean }> = {
    tesla: { base: "#0a2a3a", accent: "#00d4ff", clouds: true },
    matrix: { base: "#0a1a0a", accent: "#00ff41", clouds: false },
    molana: { base: "#2a0a1a", accent: "#ff6b9d", clouds: true },
    davinci: { base: "#2a2a0a", accent: "#ffd700", clouds: true },
    beethoven: { base: "#2a1a0a", accent: "#ff8c00", clouds: true },
    nebula: { base: "#1a1a2a", accent: "#8888aa", clouds: false },
    aurora: { base: "#0a1a2a", accent: "#7799aa", clouds: false },
  };
  return base[star.slug] || { base: "#1a1a2a", accent: star.chakraColor, clouds: false };
}

export default function OrbitingPlanet({
  star, orbitRadiusX, orbitRadiusZ, orbitSpeed, orbitOffset,
  globalTimeRef, timeScrub, planetRadius, showLabel,
  onClick, isHovered, onHover, planetPositionsRef,
}: OrbitingPlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPos = useRef(new THREE.Vector3());

  useFrame(() => {
    const t = globalTimeRef.current + timeScrub * 0.01;
    const angle = orbitOffset + t * orbitSpeed;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angle) * orbitRadiusX;
      groupRef.current.position.z = Math.sin(angle) * orbitRadiusZ;
      groupRef.current.position.y = Math.sin(angle * 2) * 0.3;

      // Report world position
      groupRef.current.getWorldPosition(worldPos.current);
      planetPositionsRef.current.set(star.slug, worldPos.current.clone());
    }
  });

  const colors = getColors(star);

  return (
    <group ref={groupRef}>
      {/* Click target */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(star); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[planetRadius * 1.4, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <ProceduralPlanet
        position={[0, 0, 0]}
        radius={planetRadius}
        baseColor={colors.base}
        accentColor={colors.accent}
        showClouds={colors.clouds}
        rotationSpeed={0.06}
        atmosphereIntensity={isHovered ? 1.8 : 0.8}
      />

      {showLabel && (
        <Html center position={[0, planetRadius + 0.55, 0]} style={{ pointerEvents: "none" }}>
          <div className="text-center whitespace-nowrap select-none">
            <p className={`text-foreground text-xs font-bold drop-shadow-lg transition-opacity ${isHovered ? "opacity-100" : "opacity-60"}`}>
              {star.displayNameFa}
            </p>
            <p className="text-muted-foreground text-[9px]">{star.displayNameEn}</p>
          </div>
        </Html>
      )}
    </group>
  );
}
