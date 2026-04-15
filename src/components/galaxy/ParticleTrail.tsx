import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * ParticleTrail — Lightweight particle system for hover trails and click bursts.
 * Uses point sprites with decay. Max ~300 particles.
 */

const MAX_PARTICLES = 300;

interface ParticleTrailProps {
  /** World position to emit from */
  emitPosition: THREE.Vector3;
  /** Emit particles when true */
  active: boolean;
  /** Trigger a burst effect */
  burst: boolean;
  /** Color of particles */
  color: string;
  /** Called after burst completes */
  onBurstDone?: () => void;
}

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

export default function ParticleTrail({ emitPosition, active, burst, color, onBurstDone }: ParticleTrailProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const particlesRef = useRef<Particle[]>([]);
  const burstFiredRef = useRef(false);
  const burstDoneNotified = useRef(false);

  const colObj = useMemo(() => new THREE.Color(color), [color]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const opacities = new Float32Array(MAX_PARTICLES);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("opacity", new THREE.BufferAttribute(opacities, 1));
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      color: colObj,
      size: 0.08,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
  }, [colObj]);

  useFrame((_, delta) => {
    const particles = particlesRef.current;

    // Emit trail particles when hovering
    if (active && !burst) {
      for (let i = 0; i < 2; i++) {
        if (particles.length < MAX_PARTICLES) {
          particles.push({
            pos: emitPosition.clone().add(
              new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
              )
            ),
            vel: new THREE.Vector3(
              (Math.random() - 0.5) * 0.4,
              (Math.random() - 0.5) * 0.4,
              (Math.random() - 0.5) * 0.4
            ),
            life: 0,
            maxLife: 0.5 + Math.random() * 0.7,
          });
        }
      }
    }

    // Burst on click
    if (burst && !burstFiredRef.current) {
      burstFiredRef.current = true;
      burstDoneNotified.current = false;
      const burstCount = Math.min(60, MAX_PARTICLES - particles.length);
      for (let i = 0; i < burstCount; i++) {
        const dir = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize();
        particles.push({
          pos: emitPosition.clone(),
          vel: dir.multiplyScalar(1.5 + Math.random() * 2),
          life: 0,
          maxLife: 0.4 + Math.random() * 0.8,
        });
      }
    }

    if (!burst) {
      burstFiredRef.current = false;
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }
      p.pos.addScaledVector(p.vel, delta);
      p.vel.multiplyScalar(0.96); // drag
    }

    // Notify burst done
    if (burstFiredRef.current && particles.length === 0 && !burstDoneNotified.current) {
      burstDoneNotified.current = true;
      onBurstDone?.();
    }

    // Update geometry
    const posArr = geometry.attributes.position as THREE.BufferAttribute;
    const opArr = geometry.attributes.opacity as THREE.BufferAttribute;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < particles.length) {
        const p = particles[i];
        posArr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
        opArr.setX(i, 1 - p.life / p.maxLife);
      } else {
        posArr.setXYZ(i, 0, 0, -1000);
        opArr.setX(i, 0);
      }
    }
    posArr.needsUpdate = true;
    opArr.needsUpdate = true;

    if (pointsRef.current) {
      pointsRef.current.geometry.setDrawRange(0, particles.length);
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
