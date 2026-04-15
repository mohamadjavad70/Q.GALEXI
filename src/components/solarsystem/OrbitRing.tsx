import { useMemo } from "react";
import * as THREE from "three";

/**
 * OrbitRing — Thin elliptical orbit line around the sun.
 */

interface OrbitRingProps {
  radiusX: number;
  radiusZ: number;
  color?: string;
  opacity?: number;
}

export default function OrbitRing({ radiusX, radiusZ, color = "#ffffff", opacity = 0.1 }: OrbitRingProps) {
  const lineObj = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segs = 64;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radiusX, 0, Math.sin(a) * radiusZ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    return new THREE.Line(geo, mat);
  }, [radiusX, radiusZ, color, opacity]);

  return <primitive object={lineObj} />;
}
