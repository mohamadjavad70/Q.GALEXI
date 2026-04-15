import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/**
 * QSun — Central pulsing sun (cosmic turquoise-gold) linked to ledger activity.
 */

const sunVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const sunFragment = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  varying vec3 vNormal;
  varying vec3 vPosition;

  vec3 hash3(vec3 p) {
    p = vec3(dot(p, vec3(127.1,311.7,74.7)),
             dot(p, vec3(269.5,183.3,246.1)),
             dot(p, vec3(113.5,271.9,124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }
  float noise3d(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    vec3 u = f*f*(3.0-2.0*f);
    return mix(mix(mix(dot(hash3(i),f), dot(hash3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),
                   mix(dot(hash3(i+vec3(0,1,0)),f-vec3(0,1,0)), dot(hash3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
               mix(mix(dot(hash3(i+vec3(0,0,1)),f-vec3(0,0,1)), dot(hash3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),
                   mix(dot(hash3(i+vec3(0,1,1)),f-vec3(0,1,1)), dot(hash3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a*noise3d(p); p = p*2.0+100.0; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 n = vNormal * 3.0 + uTime * 0.15;
    float f = fbm(n) * 0.5 + 0.5;
    float pulse = sin(uTime * 2.0 + uPulse) * 0.15 + 0.85;
    vec3 col = mix(uColor1, uColor2, f) * pulse;
    // Fresnel rim
    vec3 viewDir = normalize(-vPosition);
    float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
    col += pow(rim, 2.5) * uColor2 * 0.6;
    col *= 1.2; // emissive boost
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface QSunProps {
  ledgerCount: number;
  onClick: () => void;
}

export default function QSun({ ledgerCount, onClick }: QSunProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const col1 = useMemo(() => new THREE.Color("#00d4ff"), []);
  const col2 = useMemo(() => new THREE.Color("#ffd700"), []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPulse: { value: Math.min(ledgerCount * 0.3, 5) },
    uColor1: { value: col1 },
    uColor2: { value: col2 },
  }), [col1, col2, ledgerCount]);

  useFrame((_, delta) => {
    if (matRef.current) matRef.current.uniforms.uTime.value += delta;
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.05;
    if (glowRef.current) {
      const s = 1 + Math.sin(Date.now() * 0.002 + ledgerCount) * 0.08;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      {/* Sun body */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[1.8, 32, 32]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={sunVertex}
          fragmentShader={sunFragment}
          uniforms={uniforms}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.4, 24, 24]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Second glow ring */}
      <mesh>
        <sphereGeometry args={[3.0, 16, 16]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <pointLight color="#ffd700" intensity={2} distance={30} />
      <pointLight color="#00d4ff" intensity={1} distance={20} />

      <Html center position={[0, -2.5, 0]} style={{ pointerEvents: "none" }}>
        <div className="text-center whitespace-nowrap select-none">
          <p className="text-foreground text-sm font-bold drop-shadow-lg">Q Core</p>
          <p className="text-muted-foreground text-[10px]">اتاق آرام</p>
        </div>
      </Html>
    </group>
  );
}
