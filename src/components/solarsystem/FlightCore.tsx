/**
 * FlightCore — Unified navigation system for the Solar System Explorer.
 *
 * Single R3F component managing 3 modes: FREE, FOCUS, AUTOPILOT.
 * One shared velocity/position state — no mode-switch jitter.
 */

import { useRef, useEffect, useMemo, type ElementRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { logAction } from "@/lib/geneticHash";

/* ─── Types ─── */

export type NavMode = "FREE" | "FOCUS" | "AUTOPILOT";

export interface FlightTelemetry {
  speed: number;
  position: [number, number, number];
  altitude: number;
  navMode: NavMode;
  autopilotTarget: string | null;
  autopilotDist: number;
  autopilotETA: number; // seconds
}

export interface FlightCoreProps {
  navMode: NavMode;
  mouseLook: boolean;
  inertia: number; // 0..1  (0 = snappy, 1 = floaty)
  keysRef: React.MutableRefObject<Set<string>>;
  telemetryRef: React.MutableRefObject<FlightTelemetry>;
  planetPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>;
  planetRadii: Map<string, number>;
  focusSlug: string | null;
  autopilotSlug: string | null;
  onAutopilotDock: (slug: string) => void;
  onBrake?: () => void;
}

/* ─── Constants ─── */

const BASE_ACCEL = 20;
const BOOST_MULT = 3;
const BASE_MAX_SPEED = 25;
const BOOST_MAX_SPEED = 70;
const SENSITIVITY = 0.0025;
const PITCH_LIMIT = (75 * Math.PI) / 180;
const BRAKE_DAMP = 8;

// Autopilot
const CRUISE_SPEED = 18;
const APPROACH_DIST = 12; // start slowing
const DOCK_DIST = 3.5;
const STEER_STRENGTH = 2.5;

// Safety
const BOUNDARY_RADIUS = 60;
const BOUNDARY_FORCE = 8;
const PLANET_PUSH_MULT = 1.15;
const PLANET_PUSH_FORCE = 12;

// Focus orbit
const FOCUS_BASE_DIST = 3;
const FOCUS_RADIUS_K = 4;

export default function FlightCore({
  navMode,
  mouseLook,
  inertia,
  keysRef,
  telemetryRef,
  planetPositionsRef,
  planetRadii,
  focusSlug,
  autopilotSlug,
  onAutopilotDock,
}: FlightCoreProps) {
  const { camera, gl } = useThree();

  // Persistent flight state (survives mode switches)
  const vel = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const dragging = useRef(false);
  const savedVel = useRef(new THREE.Vector3());
  const prevMode = useRef<NavMode>(navMode);
  const orbitRef = useRef<ElementRef<typeof OrbitControls> | null>(null);
  const focusInitialized = useRef<string | null>(null);
  const dockFired = useRef<string | null>(null);

  // Derived damping from inertia slider (0 = snappy ~5, 1 = floaty ~0.5)
  const damping = useMemo(() => 0.5 + (1 - inertia) * 4.5, [inertia]);

  /* ─── Keyboard listeners ─── */
  useEffect(() => {
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
  }, [keysRef]);

  /* ─── Mouse/Touch look ─── */
  useEffect(() => {
    if (!mouseLook || navMode === "FOCUS") return;
    const canvas = gl.domElement;

    const onDown = () => {
      dragging.current = true;
      euler.current.setFromQuaternion(camera.quaternion);
    };
    const onUp = () => { dragging.current = false; };
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      euler.current.y -= e.movementX * SENSITIVITY;
      euler.current.x -= e.movementY * SENSITIVITY;
      euler.current.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };

    // Touch look (right side of screen)
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (t.clientX > window.innerWidth * 0.5) {
        dragging.current = true;
        euler.current.setFromQuaternion(camera.quaternion);
      }
    };
    const onTouchEnd = () => { dragging.current = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current || e.changedTouches.length === 0) return;
      // approximate movementX/Y via touch
      // We'll skip detailed touch tracking to keep it simple
    };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [mouseLook, navMode, camera, gl]);

  /* ─── Mode transition handling ─── */
  useEffect(() => {
    const prev = prevMode.current;
    prevMode.current = navMode;

    if (prev !== "FOCUS" && navMode === "FOCUS") {
      // Entering focus: save velocity, zero it
      savedVel.current.copy(vel.current);
      vel.current.set(0, 0, 0);
      focusInitialized.current = null;
    }

    if (prev === "FOCUS" && navMode === "FREE") {
      // Leaving focus: optionally restore velocity
      vel.current.copy(savedVel.current).multiplyScalar(0.3); // gentle restore
      focusInitialized.current = null;
    }

    if (navMode === "AUTOPILOT") {
      dockFired.current = null;
    }
  }, [navMode]);

  /* ─── Main update loop ─── */
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const k = keysRef.current;
    const v = vel.current;

    if (navMode === "FREE") {
      /* ── FREE mode: manual flight ── */
      const boost = k.has("shift");
      const braking = k.has(" "); // space bar
      const accel = BASE_ACCEL * (boost ? BOOST_MULT : 1);
      const maxSpd = boost ? BOOST_MAX_SPEED : BASE_MAX_SPEED;

      if (braking) {
        // Strong damping to zero
        const brakeFactor = Math.exp(-BRAKE_DAMP * dt);
        v.multiplyScalar(brakeFactor);
      } else {
        // Input acceleration
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
          v.add(input);
        }

        // Clamp to max speed
        if (v.length() > maxSpd) {
          v.normalize().multiplyScalar(maxSpd);
        }
      }

      // Natural damping
      const dampFactor = Math.exp(-damping * dt);
      v.multiplyScalar(dampFactor);

      // Apply velocity
      camera.position.addScaledVector(v, dt);

    } else if (navMode === "AUTOPILOT" && autopilotSlug) {
      /* ── AUTOPILOT mode: seek → approach → dock ── */
      const targetPos = planetPositionsRef.current.get(autopilotSlug);
      if (targetPos) {
        const toTarget = targetPos.clone().sub(camera.position);
        const dist = toTarget.length();
        const dir = toTarget.normalize();

        // Speed based on distance (SEEK fast, APPROACH slow)
        let targetSpeed = CRUISE_SPEED;
        if (dist < APPROACH_DIST) {
          targetSpeed = CRUISE_SPEED * (dist / APPROACH_DIST) * 0.5 + 1;
        }

        // Steering
        const desiredVel = dir.multiplyScalar(targetSpeed);
        const steering = desiredVel.clone().sub(v).multiplyScalar(STEER_STRENGTH);
        v.addScaledVector(steering, dt);

        // Clamp
        if (v.length() > CRUISE_SPEED * 1.2) {
          v.normalize().multiplyScalar(CRUISE_SPEED * 1.2);
        }

        // Look gently toward target
        const lookMat = new THREE.Matrix4().lookAt(camera.position, targetPos, camera.up);
        const lookQuat = new THREE.Quaternion().setFromRotationMatrix(lookMat);
        camera.quaternion.slerp(lookQuat, Math.min(dt * 1.5, 0.04));

        // Apply velocity
        camera.position.addScaledVector(v, dt);

        // Dock check
        if (dist < DOCK_DIST && dockFired.current !== autopilotSlug) {
          dockFired.current = autopilotSlug;
          v.set(0, 0, 0);
          logAction("autopilot_dock", autopilotSlug);
          onAutopilotDock(autopilotSlug);
        }

        // Update telemetry with autopilot-specific data
        telemetryRef.current.autopilotDist = dist;
        telemetryRef.current.autopilotETA = v.length() > 0.5 ? dist / v.length() : 0;
      }

    } else if (navMode === "FOCUS" && orbitRef.current) {
      /* ── FOCUS mode: OrbitControls handles camera ── */
      const pos = focusSlug
        ? planetPositionsRef.current.get(focusSlug) || new THREE.Vector3()
        : new THREE.Vector3();
      orbitRef.current.target.lerp(pos, 0.06);
      orbitRef.current.update();

      // Position camera on first focus or slug change
      if (focusInitialized.current !== focusSlug) {
        const pRadius = focusSlug ? (planetRadii.get(focusSlug) || 0.5) : 0.5;
        const orbitDist = pRadius * FOCUS_RADIUS_K + FOCUS_BASE_DIST;
        camera.position.copy(pos).add(new THREE.Vector3(orbitDist * 0.7, orbitDist * 0.5, orbitDist * 0.7));
        focusInitialized.current = focusSlug;
      }
    }

    /* ── Safety Rails (apply in FREE and AUTOPILOT) ── */
    if (navMode !== "FOCUS") {
      // Soft boundary sphere
      const distFromCenter = camera.position.length();
      if (distFromCenter > BOUNDARY_RADIUS) {
        const pushDir = camera.position.clone().normalize().negate();
        const overshoot = distFromCenter - BOUNDARY_RADIUS;
        v.addScaledVector(pushDir, overshoot * BOUNDARY_FORCE * dt * 0.1);
      }

      // Planet penetration prevention
      planetPositionsRef.current.forEach((pPos, slug) => {
        const pRadius = (planetRadii.get(slug) || 0.5) * PLANET_PUSH_MULT;
        const toPlanet = camera.position.clone().sub(pPos);
        const dist = toPlanet.length();
        if (dist < pRadius) {
          const pushDir = toPlanet.normalize();
          const penetration = pRadius - dist;
          v.addScaledVector(pushDir, penetration * PLANET_PUSH_FORCE * dt);
        }
      });
    }

    /* ── Update telemetry (always) ── */
    telemetryRef.current.speed = v.length();
    telemetryRef.current.position = [camera.position.x, camera.position.y, camera.position.z];
    telemetryRef.current.altitude = camera.position.y;
    telemetryRef.current.navMode = navMode;
    telemetryRef.current.autopilotTarget = autopilotSlug;
  });

  /* ── Render OrbitControls only in FOCUS mode ── */
  if (navMode === "FOCUS") {
    return (
      <OrbitControls
        ref={orbitRef}
        enablePan={false}
        maxDistance={12}
        minDistance={1.5}
        autoRotate
        autoRotateSpeed={0.5}
      />
    );
  }

  return null;
}
