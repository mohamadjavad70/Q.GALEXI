import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/**
 * UserPlanetOrb — Small orb in the outer ring representing a user-created planet seed.
 */

export interface PlanetSeed {
  id: string;
  name: string;
  prompt: string;
  category: string;
  chakraColor: string;
  supports: number;
  forks: number;
  createdAt: number;
  records: PlanetRecord[];
}

export interface PlanetRecord {
  id: string;
  title: string;
  description: string;
  promptSnippet: string;
  createdAt: number;
}

interface UserPlanetOrbProps {
  seed: PlanetSeed;
  orbitRadius: number;
  orbitOffset: number;
  timeScale: number;
  onClick: () => void;
}

export default function UserPlanetOrb({ seed, orbitRadius, orbitOffset, timeScale, onClick }: UserPlanetOrbProps) {
  const ref = useRef<THREE.Group>(null);
  const angleRef = useRef(orbitOffset);

  useFrame((_, delta) => {
    angleRef.current += delta * 0.15 * timeScale;
    if (ref.current) {
      ref.current.position.x = Math.cos(angleRef.current) * orbitRadius;
      ref.current.position.z = Math.sin(angleRef.current) * orbitRadius;
      ref.current.position.y = Math.sin(angleRef.current * 3) * 0.2;
    }
  });

  return (
    <group ref={ref}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial
          color={seed.chakraColor}
          emissive={seed.chakraColor}
          emissiveIntensity={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshBasicMaterial
          color={seed.chakraColor}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight color={seed.chakraColor} intensity={0.3} distance={3} />
      <Html center position={[0, 0.5, 0]} style={{ pointerEvents: "none" }}>
        <p className="text-foreground text-[8px] font-bold whitespace-nowrap drop-shadow-lg opacity-60">{seed.name}</p>
      </Html>
    </group>
  );
}
