import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SPEED = 5;
const FRICTION = 0.88;
const LERP_FACTOR = 0.15;
const TERRAIN_Y = 0.5;
const BOUNDARY = 28;

export function usePlayerMovement() {
  const meshRef = useRef<THREE.Mesh>(null);
  const velocity = useRef(new THREE.Vector3());
  const keys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => keys.current.add(e.code);
    const onKeyUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    const k = keys.current;
    const dir = new THREE.Vector3();
    if (k.has('KeyW') || k.has('ArrowUp')) dir.z -= 1;
    if (k.has('KeyS') || k.has('ArrowDown')) dir.z += 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) dir.x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) dir.x += 1;

    if (dir.length() > 0) dir.normalize();

    velocity.current.lerp(dir.multiplyScalar(SPEED), LERP_FACTOR);
    velocity.current.multiplyScalar(FRICTION);

    if (meshRef.current) {
      meshRef.current.position.addScaledVector(velocity.current, delta);
      // Clamp to terrain boundary
      meshRef.current.position.x = THREE.MathUtils.clamp(
        meshRef.current.position.x,
        -BOUNDARY,
        BOUNDARY,
      );
      meshRef.current.position.z = THREE.MathUtils.clamp(
        meshRef.current.position.z,
        -BOUNDARY,
        BOUNDARY,
      );
      // Lock on terrain
      meshRef.current.position.y = TERRAIN_Y;
    }
  });

  return meshRef;
}
