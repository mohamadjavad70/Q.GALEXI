import { forwardRef, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerMovement } from './usePlayerMovement';

const CAMERA_OFFSET = new THREE.Vector3(0, 7, 12);
const CAMERA_LERP = 0.08;

export const Player = forwardRef<THREE.Mesh, Record<string, never>>(function Player(_, externalRef) {
  const meshRef = usePlayerMovement();
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!meshRef.current) return;
    const pos = meshRef.current.position;
    // Sync external ref برای proximity detection در Agent3D
    if (externalRef && typeof externalRef !== 'function' && externalRef.current !== meshRef.current) {
      (externalRef as React.MutableRefObject<THREE.Mesh | null>).current = meshRef.current;
    }
    // Smooth camera follow
    const targetCamPos = pos.clone().add(CAMERA_OFFSET);
    camera.position.lerp(targetCamPos, CAMERA_LERP);
    // Smooth look-at
    lookTarget.current.lerp(pos, 0.12);
    camera.lookAt(lookTarget.current);
  });

  return (
    <group>
      {/* Body */}
      <mesh ref={meshRef} position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.55, 1, 0.55]} />
        <meshStandardMaterial color="#00d4ff" emissive="#005577" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
});

