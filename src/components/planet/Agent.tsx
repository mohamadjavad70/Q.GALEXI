import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface AgentProps {
  position?: [number, number, number];
  planetId?: string;
  name?: string;
}

interface AgentResponse {
  reply: string;
}

export function Agent({ position = [4, 0.5, -4], planetId, name = 'AGENT Q' }: AgentProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const glowPhase = useRef(0);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.6;
    }
    glowPhase.current += delta * 2;
    if (glowRef.current) {
      glowRef.current.intensity = 0.4 + Math.sin(glowPhase.current) * 0.2;
    }
  });

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setMessage('...');
    try {
      const res = await fetch(`${API_BASE}/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planetId }),
      });
      if (!res.ok) throw new Error('server error');
      const data = (await res.json()) as AgentResponse;
      setMessage(data.reply);
    } catch {
      setMessage('ارتباط برقرار نشد');
    } finally {
      setLoading(false);
    }
    // Auto-clear after 5 seconds
    setTimeout(() => setMessage(''), 5000);
  }

  return (
    <group position={position}>
      <pointLight ref={glowRef} color="#ff6600" intensity={0.4} distance={4} />

      {/* Agent sphere */}
      <mesh ref={meshRef} onClick={handleClick} castShadow>
        <sphereGeometry args={[0.45, 20, 20]} />
        <meshStandardMaterial
          color="#ff6600"
          emissive="#882200"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>

      {/* Ring orbit */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.65, 0.02, 6, 40]} />
        <meshStandardMaterial color="#ffaa44" emissive="#663300" />
      </mesh>

      {/* Chat bubble */}
      {message && (
        <Html center distanceFactor={8} position={[0, 1.4, 0]}>
          <div
            style={{
              background: 'rgba(0,0,0,0.9)',
              border: '1px solid #ff6600',
              borderRadius: 8,
              padding: '8px 14px',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: 13,
              maxWidth: 220,
              textAlign: 'center',
              direction: 'rtl',
              whiteSpace: 'pre-wrap',
              pointerEvents: 'none',
            }}
          >
            {message}
          </div>
        </Html>
      )}

      {/* Label */}
      <Html center distanceFactor={8} position={[0, -0.85, 0]}>
        <div
          style={{
            color: loading ? '#ffaa44' : '#ff9940',
            fontFamily: 'monospace',
            fontSize: 11,
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {loading ? '⟳' : '▲'} {name}
        </div>
      </Html>
    </group>
  );
}
