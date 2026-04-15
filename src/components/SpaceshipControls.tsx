import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * SpaceshipControls — Damped free-fly camera with WASD/QE + mouse-look.
 * Supports autopilot: smoothly flies camera toward a target planet.
 */

export interface TelemetryData {
  speed: number;
  position: [number, number, number];
  altitude: number;
}

interface SpaceshipControlsProps {
  enabled: boolean;
  mouseLook: boolean;
  keysRef: React.MutableRefObject<Set<string>>;
  telemetryRef: React.MutableRefObject<TelemetryData>;
  planetPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>;
  autopilotSlug: string | null;
  onAutopilotArrived?: () => void;
}

const ACCEL = 18;
const BOOST_ACCEL = 50;
const DECAY = 2.5; // exponential decay constant (e^-2.5 ≈ 0.08 after 1s)
const SENSITIVITY = 0.003;
const AUTOPILOT_SPEED = 14;
const AUTOPILOT_ARRIVE_DIST = 4;

export default function SpaceshipControls({
  enabled,
  mouseLook,
  keysRef,
  telemetryRef,
  planetPositionsRef,
  autopilotSlug,
  onAutopilotArrived,
}: SpaceshipControlsProps) {
  const { camera, gl } = useThree();
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const velocity = useRef(new THREE.Vector3());
  const isLocked = useRef(false);

  // Keyboard listeners → shared keysRef
  useEffect(() => {
    if (!enabled) return;
    const keySet = keysRef.current;
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keySet.add(e.key.toLowerCase());
    };
    const up = (e: KeyboardEvent) => keySet.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keySet.clear();
    };
  }, [enabled, keysRef]);

  // Mouse look (click-drag, no pointer lock)
  useEffect(() => {
    if (!enabled || !mouseLook) return;
    const canvas = gl.domElement;
    const onDown = () => {
      isLocked.current = true;
      euler.current.setFromQuaternion(camera.quaternion);
    };
    const onUp = () => { isLocked.current = false; };
    const onMove = (e: MouseEvent) => {
      if (!isLocked.current) return;
      euler.current.y -= e.movementX * SENSITIVITY;
      euler.current.x -= e.movementY * SENSITIVITY;
      euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    return () => {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
    };
  }, [enabled, mouseLook, camera, gl]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const dt = Math.min(delta, 0.1); // cap for stability
    const k = keysRef.current;
    const vel = velocity.current;

    if (autopilotSlug) {
      // Autopilot: fly toward target planet
      const targetPos = planetPositionsRef.current.get(autopilotSlug);
      if (targetPos) {
        const dir = targetPos.clone().sub(camera.position);
        const dist = dir.length();
        if (dist < AUTOPILOT_ARRIVE_DIST) {
          vel.multiplyScalar(0.5);
          onAutopilotArrived?.();
        } else {
          dir.normalize();
          // Smoothly steer velocity toward target
          const desired = dir.multiplyScalar(AUTOPILOT_SPEED);
          vel.lerp(desired, 0.03);
          // Smoothly look at target
          const lookTarget = targetPos.clone();
          const lookQuat = new THREE.Quaternion();
          const lookMat = new THREE.Matrix4().lookAt(camera.position, lookTarget, camera.up);
          lookQuat.setFromRotationMatrix(lookMat);
          camera.quaternion.slerp(lookQuat, 0.02);
        }
      }
    } else {
      // Manual flight
      const accel = k.has("shift") ? BOOST_ACCEL : ACCEL;
      const input = new THREE.Vector3();
      if (k.has("w")) input.z -= 1;
      if (k.has("s")) input.z += 1;
      if (k.has("a")) input.x -= 1;
      if (k.has("d")) input.x += 1;
      if (k.has("q")) input.y -= 1;
      if (k.has("e")) input.y += 1;
      if (input.lengthSq() > 0) {
        input.normalize().multiplyScalar(accel * dt);
        input.applyQuaternion(camera.quaternion);
        vel.add(input);
      }
    }

    // Frame-independent damping
    const dampFactor = Math.exp(-DECAY * dt);
    vel.multiplyScalar(dampFactor);

    // Apply velocity
    camera.position.addScaledVector(vel, dt);

    // Update telemetry
    telemetryRef.current = {
      speed: vel.length(),
      position: [camera.position.x, camera.position.y, camera.position.z],
      altitude: camera.position.y,
    };
  });

  return null;
}
