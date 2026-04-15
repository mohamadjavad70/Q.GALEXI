import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * ProceduralPlanet — Lightweight procedural planet with fbm noise shading,
 * atmosphere fresnel glow, and optional cloud shell.
 */

const planetVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const planetFragment = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uAccentColor;
  uniform float uTime;
  uniform float uRoughness;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  // Simple 3D noise hash
  vec3 hash3(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise3d(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
                       dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                   mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                       dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
               mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                       dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                   mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                       dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 5; i++) {
      v += a * noise3d(p);
      p = p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // Surface noise
    vec3 noisePos = vNormal * 3.0 + uTime * 0.02;
    float n = fbm(noisePos) * 0.5 + 0.5;

    // Color bands
    vec3 col = mix(uBaseColor, uAccentColor, smoothstep(0.3, 0.7, n));
    col = mix(col, uBaseColor * 0.6, smoothstep(0.7, 0.9, n));

    // Fake lighting via perturbed normal
    float eps = 0.01;
    float nx = fbm(noisePos + vec3(eps, 0.0, 0.0)) - fbm(noisePos - vec3(eps, 0.0, 0.0));
    float ny = fbm(noisePos + vec3(0.0, eps, 0.0)) - fbm(noisePos - vec3(0.0, eps, 0.0));
    float nz = fbm(noisePos + vec3(0.0, 0.0, eps)) - fbm(noisePos - vec3(0.0, 0.0, eps));
    vec3 perturbedNormal = normalize(vNormal + vec3(nx, ny, nz) * 0.8);

    // Directional light
    vec3 lightDir = normalize(vec3(1.0, 0.8, 0.5));
    float diff = max(dot(perturbedNormal, lightDir), 0.0);
    float amb = 0.15;

    // Roughness/specular
    vec3 viewDir = normalize(-vPosition);
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(perturbedNormal, halfDir), 0.0), mix(8.0, 64.0, 1.0 - uRoughness));

    col = col * (amb + diff * 0.85) + spec * 0.3 * uAccentColor;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragment = /* glsl */ `
  uniform vec3 uGlowColor;
  uniform float uIntensity;

  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
    fresnel = pow(fresnel, 3.0) * uIntensity;
    gl_FragColor = vec4(uGlowColor, fresnel * 0.7);
  }
`;

const cloudVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cloudFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCloudColor;

  varying vec3 vNormal;
  varying vec2 vUv;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }

  float noise2d(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dot(hash2(i), f),
                   dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                   dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
  }

  float cloudFbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise2d(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 p = vUv * 4.0 + uTime * 0.01;
    float c = cloudFbm(p) * 0.5 + 0.5;
    float alpha = smoothstep(0.4, 0.7, c) * 0.35;
    gl_FragColor = vec4(uCloudColor, alpha);
  }
`;

interface ProceduralPlanetProps {
  position: [number, number, number];
  radius?: number;
  baseColor?: string;
  accentColor?: string;
  roughness?: number;
  rotationSpeed?: number;
  showClouds?: boolean;
  atmosphereIntensity?: number;
}

export default function ProceduralPlanet({
  position,
  radius = 1,
  baseColor = "#1a3a4a",
  accentColor = "#00d4ff",
  roughness = 0.7,
  rotationSpeed = 0.08,
  showClouds = true,
  atmosphereIntensity = 1.2,
}: ProceduralPlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const planetMatRef = useRef<THREE.ShaderMaterial>(null);
  const cloudMatRef = useRef<THREE.ShaderMaterial>(null);

  const baseCol = useMemo(() => new THREE.Color(baseColor), [baseColor]);
  const accentCol = useMemo(() => new THREE.Color(accentColor), [accentColor]);
  const glowCol = useMemo(() => new THREE.Color(accentColor), [accentColor]);
  const cloudCol = useMemo(() => new THREE.Color("#ffffff"), []);

  const planetUniforms = useMemo(() => ({
    uBaseColor: { value: baseCol },
    uAccentColor: { value: accentCol },
    uTime: { value: 0 },
    uRoughness: { value: roughness },
  }), [baseCol, accentCol, roughness]);

  const atmoUniforms = useMemo(() => ({
    uGlowColor: { value: glowCol },
    uIntensity: { value: atmosphereIntensity },
  }), [glowCol, atmosphereIntensity]);

  const cloudUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCloudColor: { value: cloudCol },
  }), [cloudCol]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y -= delta * rotationSpeed * 0.5;
    }
    if (planetMatRef.current) {
      planetMatRef.current.uniforms.uTime.value += delta;
    }
    if (cloudMatRef.current) {
      cloudMatRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* Planet body */}
        <mesh>
          <sphereGeometry args={[radius, 32, 32]} />
          <shaderMaterial
            ref={planetMatRef}
            vertexShader={planetVertex}
            fragmentShader={planetFragment}
            uniforms={planetUniforms}
          />
        </mesh>
      </group>

      {/* Atmosphere shell */}
      <mesh>
        <sphereGeometry args={[radius * 1.15, 32, 32]} />
        <shaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          uniforms={atmoUniforms}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Cloud shell */}
      {showClouds && (
        <mesh ref={cloudRef}>
          <sphereGeometry args={[radius * 1.04, 32, 32]} />
          <shaderMaterial
            ref={cloudMatRef}
            vertexShader={cloudVertex}
            fragmentShader={cloudFragment}
            uniforms={cloudUniforms}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
