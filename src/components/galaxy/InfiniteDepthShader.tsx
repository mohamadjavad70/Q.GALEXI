/**
 * Infinite Depth Shader — Multi-layered Galaxy with Parallax
 * ────────────────────────────────────────────────────────────
 * Creates illusion of infinite depth using shader-based layering
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface InfiniteDepthShaderProps {
  layers?: number;
  density?: number;
  color?: string;
}

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uLayers;
  uniform float uDensity;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  // Pseudo-random function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  // Noise function
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  // Fractal Brownian Motion for depth layers
  float fbm(vec2 st, float layers) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(float i = 0.0; i < 8.0; i++) {
      if(i >= layers) break;
      value += amplitude * noise(st * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  // Create star field for a specific layer
  float starLayer(vec2 st, float depth, float time) {
    // Scale based on depth
    vec2 pos = st * (10.0 + depth * 20.0);
    
    // Add parallax motion
    pos += vec2(time * (0.02 + depth * 0.05), time * (0.01 + depth * 0.03));
    
    // Grid-based stars
    vec2 gridPos = floor(pos);
    vec2 localPos = fract(pos);
    
    float star = 0.0;
    
    // Check neighboring cells for stars
    for(float y = -1.0; y <= 1.0; y++) {
      for(float x = -1.0; x <= 1.0; x++) {
        vec2 neighbor = vec2(x, y);
        vec2 cellPos = gridPos + neighbor;
        
        // Random position within cell
        float rnd = random(cellPos);
        if(rnd > 1.0 - uDensity * 0.01) {
          vec2 starPos = neighbor + vec2(random(cellPos + 0.1), random(cellPos + 0.2));
          float dist = length(localPos - starPos);
          
          // Star brightness based on depth (farther = dimmer)
          float brightness = (1.0 - depth) * 0.8 + 0.2;
          
          // Twinkle effect
          float twinkle = sin(time * 2.0 + rnd * 100.0) * 0.3 + 0.7;
          
          // Star size varies with depth
          float size = 0.02 + depth * 0.01;
          star += brightness * twinkle * smoothstep(size, 0.0, dist);
        }
      }
    }
    
    return star;
  }
  
  void main() {
    vec2 st = vUv;
    vec3 color = vec3(0.0);
    
    // Create multiple depth layers
    for(float layer = 0.0; layer < 10.0; layer++) {
      if(layer >= uLayers) break;
      
      float depth = layer / uLayers;
      
      // Add star field for this layer
      float stars = starLayer(st, depth, uTime);
      
      // Add nebula-like clouds in deeper layers
      if(depth > 0.3) {
        vec2 cloudPos = st * (2.0 + depth * 3.0);
        cloudPos += vec2(uTime * 0.01, uTime * 0.005) * (1.0 + depth);
        float clouds = fbm(cloudPos, 4.0) * (1.0 - depth * 0.5);
        clouds = smoothstep(0.3, 0.8, clouds) * 0.15;
        color += uColor * clouds * (1.0 - depth * 0.6);
      }
      
      // Combine layers with depth-based brightness
      color += vec3(stars) * (1.0 - depth * 0.3);
    }
    
    // Add subtle vignette for depth perception
    float vignette = 1.0 - length(vUv - 0.5) * 0.5;
    color *= vignette;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function InfiniteDepthShader({
  layers = 6,
  density = 5,
  color = '#4060aa',
}: InfiniteDepthShaderProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLayers: { value: layers },
      uDensity: { value: density },
      uColor: { value: new THREE.Color(color) },
    }),
    [layers, density, color]
  );

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -50]}>
      <planeGeometry args={[200, 200, 1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
