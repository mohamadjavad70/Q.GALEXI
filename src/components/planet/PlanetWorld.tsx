import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { useParams, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { Player } from './Player';
import { Agent3D } from './Agent3D';
import { useAgentInteraction } from '../../hooks/useAgentInteraction';

function Terrain() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial color="#071520" roughness={0.9} metalness={0.1} />
      </mesh>
      <gridHelper args={[60, 40, '#0e3a5a', '#071e30']} position={[0, 0.01, 0]} />

      {/* Boundary pillars */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 26, 1.5, Math.sin(angle) * 26]}
          >
            <cylinderGeometry args={[0.12, 0.12, 3, 8]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00aacc"
              emissiveIntensity={0.8}
            />
          </mesh>
        );
      })}
    </>
  );
}

interface SceneProps {
  planetId: string;
  playerRef: React.RefObject<THREE.Mesh | null>;
}

function Scene({ planetId, playerRef }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 6, 0]} color="#003399" intensity={0.6} distance={25} />

      <Stars radius={90} depth={60} count={2500} factor={4} fade />

      <Terrain />

      <Player ref={playerRef} />

      <Agent3D agentId={`${planetId}-0`} name="کاشف-۱" role="explorer"
        initialPos={[5, -5]} energy={90} knowledge={3} playerRef={playerRef} />
      <Agent3D agentId={`${planetId}-1`} name="سازنده-۱" role="creator"
        initialPos={[-6, -4]} energy={70} knowledge={7} playerRef={playerRef} />
      <Agent3D agentId={`${planetId}-2`} name="بازرگان-۱" role="trader"
        initialPos={[0, -10]} energy={55} knowledge={12} playerRef={playerRef} />
    </>
  );
}

export default function PlanetWorld() {
  const { planetId = 'demo' } = useParams<{ planetId: string }>();
  const navigate = useNavigate();
  const { getBalance, lastReward } = useAgentInteraction();
  const [balance, setBalance] = useState<number | null>(null);
  const [rewardFlash, setRewardFlash] = useState<number | null>(null);
  const playerRef = useRef<THREE.Mesh | null>(null);

  const shortId = planetId.length > 8 ? planetId.slice(0, 8).toUpperCase() : planetId.toUpperCase();

  useEffect(() => {
    let mounted = true;
    const refresh = async () => { if (mounted) setBalance(await getBalance()); };
    refresh();
    const t = setInterval(refresh, 8000);
    return () => { mounted = false; clearInterval(t); };
  }, [getBalance]);

  useEffect(() => {
    if (lastReward != null) {
      setRewardFlash(lastReward);
      const t = setTimeout(() => setRewardFlash(null), 2500);
      return () => clearTimeout(t);
    }
  }, [lastReward]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>

      {/* HUD — top left */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          color: '#00ffff',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 'bold', letterSpacing: 2 }}>
          🪐 PLANET {shortId}
        </div>
        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6, lineHeight: 1.6 }}>
          WASD / ↑↓←→ — حرکت<br />
          کلیک روی Agent رنگی — گفتگو + Q token
        </div>
        {balance !== null && (
          <div style={{ marginTop: 10, fontSize: 13, color: '#ffe066', letterSpacing: 1 }}>
            💰 {balance} Q
          </div>
        )}
        {rewardFlash != null && (
          <div style={{
            marginTop: 6, fontSize: 16, color: '#4ade80', fontWeight: 'bold',
            animation: 'fadeUpQ 2.5s ease forwards',
          }}>
            +{rewardFlash} Q ✨
          </div>
        )}
      </div>

      {/* Back button — top right */}
      <button
        onClick={() => navigate('/galaxy')}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          background: 'rgba(0,0,0,0.75)',
          border: '1px solid #00ffff',
          color: '#00ffff',
          padding: '8px 18px',
          borderRadius: 6,
          fontFamily: 'monospace',
          fontSize: 13,
          cursor: 'pointer',
          letterSpacing: 1,
        }}
      >
        ← کهکشان
      </button>

      {/* Mini-legend — bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          color: '#ff9940',
          fontFamily: 'monospace',
          fontSize: 11,
          opacity: 0.7,
          pointerEvents: 'none',
          userSelect: 'none',
          letterSpacing: 1,
        }}
      >
        ▲ برای چت با Agent روی کره نارنجی کلیک کن
      </div>

      <Canvas
        shadows
        camera={{ position: [0, 8, 14], fov: 60 }}
        dpr={[1, Math.min(window.devicePixelRatio, 2)]}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene planetId={planetId} playerRef={playerRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
