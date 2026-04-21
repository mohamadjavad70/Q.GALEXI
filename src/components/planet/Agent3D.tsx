// ─── Agent3D — موجودیت زنده ۳D داخل سیاره ──────────────────────────────────
// حرکت wandering واقعی از agentBrain + رنگ احساسی از emotionSystem
// کلیک → reward Q token از useAgentInteraction

import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  createBrainState,
  stepBrain,
  type AgentBrainState,
  type AgentPos,
} from '../../lib/agentBrain';
import {
  createEmotionState,
  stepEmotion,
  deriveEmotion,
  blendedColor,
  blendedEmissive,
  EMOTION_PALETTE,
  type EmotionState,
} from '../../lib/emotionSystem';
import type { AgentRole } from '../../lib/agentCore';
import { useAgentInteraction } from '../../hooks/useAgentInteraction';

// ── جدول نقش به fارسی ────────────────────────────────────────────────────────
const ROLE_LABEL: Record<AgentRole, string> = {
  explorer: 'کاشف',
  creator:  'سازنده',
  trader:   'بازرگان',
  guardian: 'نگهبان',
};

// ── برچسب رفتار ───────────────────────────────────────────────────────────────
const BEHAVIOR_LABEL: Record<string, string> = {
  wandering:   '↝ گشت',
  interacting: '◎ گفتگو',
  working:     '⚙ کار',
  idle:        '· استراحت',
};

export interface Agent3DProps {
  agentId: string;
  name: string;
  role: AgentRole;
  initialPos?: [number, number];     // [x, z] در صفحه زمین
  energy?: number;                   // 0–100
  knowledge?: number;
  /** ref به موش‌واره player برای proximity detection */
  playerRef?: React.RefObject<THREE.Mesh | null>;
}

export function Agent3D({
  agentId,
  name,
  role,
  initialPos = [0, 0],
  energy = 100,
  knowledge = 0,
  playerRef,
}: Agent3DProps) {
  const { interact, lastReward } = useAgentInteraction();

  // ── state های brain و emotion در ref (بدون re-render هر فریم) ────────────
  const brainRef  = useRef<AgentBrainState>(
    createBrainState({ x: initialPos[0], z: initialPos[1] })
  );
  const emotionRef = useRef<EmotionState>(createEmotionState());

  // ── refs three.js ───────────────────────────────────────────────────────────
  const groupRef   = useRef<THREE.Group>(null);
  const bodyRef    = useRef<THREE.Mesh>(null);
  const ringRef    = useRef<THREE.Mesh>(null);
  const glowRef    = useRef<THREE.PointLight>(null);
  const glowPhase  = useRef(0);

  // ── UI state (فقط برای HUD label — نه هر فریم) ─────────────────────────────
  const [label, setLabel]   = useState(BEHAVIOR_LABEL['idle']);
  const [flashMsg, setFlash] = useState<string | null>(null);
  const updateTick = useRef(0);

  // ── نگاه‌دارنده آخرین reward برای flash ────────────────────────────────────
  const prevReward = useRef<number | null>(null);

  // ─── فریم‌لوپ اصلی ───────────────────────────────────────────────────────
  useFrame((_, delta) => {
    // موقعیت player
    const playerPos: AgentPos = playerRef?.current
      ? { x: playerRef.current.position.x, z: playerRef.current.position.z }
      : { x: 999, z: 999 };

    // ─ یک قدم brain
    const nextBrain = stepBrain(brainRef.current, playerPos, delta, 22);
    brainRef.current = nextBrain;

    // ─ به‌روزرسانی موقعیت گروه ۳D
    if (groupRef.current) {
      groupRef.current.position.x += (nextBrain.pos.x - groupRef.current.position.x) * 0.18;
      groupRef.current.position.z += (nextBrain.pos.z - groupRef.current.position.z) * 0.18;
    }

    // ─ emotion step
    const nextEmotion = deriveEmotion(
      { state: { energy, knowledge }, personality: ROLE_PERSONALITIES[role], memory: [] },
      nextBrain.state,
    );
    emotionRef.current = stepEmotion(emotionRef.current, nextEmotion, delta);
    const emo = emotionRef.current;

    // ─ رنگ مواد ← blended از emotion
    if (bodyRef.current) {
      const mat = bodyRef.current.material as THREE.MeshStandardMaterial;
      const [r, g, b] = blendedColor(emo);
      mat.color.setRGB(r, g, b);
      const [er, eg, eb] = blendedEmissive(emo);
      mat.emissive.setRGB(er, eg, eb);
      mat.emissiveIntensity = 0.4 + emo.transitionT * 0.4;
    }

    // ─ چرخش حلقه + نور pluse
    glowPhase.current += delta * 2;
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (nextBrain.state === 'interacting' ? 2.4 : 0.9);
    }
    if (glowRef.current) {
      const palette = EMOTION_PALETTE[emo.current];
      glowRef.current.color.set(palette.color);
      glowRef.current.intensity = palette.intensity * (0.5 + Math.sin(glowPhase.current) * 0.2);
    }

    // ─ body scale pulse هنگام تعامل
    if (bodyRef.current) {
      const targetScale = nextBrain.state === 'interacting' ? 1.15 : 1.0;
      bodyRef.current.scale.setScalar(
        bodyRef.current.scale.x + (targetScale - bodyRef.current.scale.x) * 0.1
      );
    }

    // ─ به‌روزرسانی UI label هر 0.5 ثانیه (نه هر فریم)
    updateTick.current += delta;
    if (updateTick.current > 0.5) {
      updateTick.current = 0;
      setLabel(BEHAVIOR_LABEL[nextBrain.state] ?? nextBrain.state);
    }
  });

  // ─── flash هنگام reward جدید ─────────────────────────────────────────────
  if (lastReward !== prevReward.current && lastReward != null) {
    prevReward.current = lastReward;
    setFlash(`+${lastReward} Q`);
    setTimeout(() => setFlash(null), 2000);
  }

  // ─── کلیک روی agent ──────────────────────────────────────────────────────
  const handleClick = useCallback(async () => {
    await interact(agentId);
  }, [interact, agentId]);

  const palette = EMOTION_PALETTE[emotionRef.current.current];
  const energyPct = Math.max(0, Math.min(100, energy));

  return (
    <group ref={groupRef} position={[initialPos[0], 0.5, initialPos[1]]}>
      <pointLight ref={glowRef} color={palette.color} intensity={0.5} distance={5} />

      {/* Body */}
      <mesh ref={bodyRef} onClick={handleClick} castShadow>
        <sphereGeometry args={[0.42, 18, 18]} />
        <meshStandardMaterial
          color={palette.color}
          emissive={palette.emissive}
          emissiveIntensity={0.6}
          roughness={0.25}
          metalness={0.5}
        />
      </mesh>

      {/* Ring orbit — سرعت بر اساس احساس */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
        <torusGeometry args={[0.62, 0.025, 6, 40]} />
        <meshStandardMaterial
          color={palette.color}
          emissive={palette.emissive}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* نوار انرژی ── arc کوچک */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[0.55, 0.06, 4, 40, (energyPct / 100) * Math.PI * 2]} />
        <meshStandardMaterial
          color={energyPct > 50 ? '#00ff88' : energyPct > 25 ? '#ffcc00' : '#ff3333'}
          emissive={energyPct > 50 ? '#004422' : '#443300'}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Flash reward */}
      {flashMsg && (
        <Html center distanceFactor={7} position={[0, 1.8, 0]}>
          <div style={{
            color: '#4ade80', fontFamily: 'monospace', fontWeight: 'bold',
            fontSize: 15, textShadow: '0 0 8px #00ff88',
            animation: 'fadeUpQ 2s ease forwards', pointerEvents: 'none',
          }}>
            {flashMsg} ✨
          </div>
        </Html>
      )}

      {/* HUD برچسب زیر agent */}
      <Html center distanceFactor={8} position={[0, -0.9, 0]}>
        <div style={{ textAlign: 'center', pointerEvents: 'none', userSelect: 'none', fontFamily: 'monospace' }}>
          <div style={{ color: palette.color, fontSize: 11, letterSpacing: 1 }}>
            ▲ {name}
          </div>
          <div style={{ color: '#aaa', fontSize: 9, marginTop: 2 }}>
            {ROLE_LABEL[role]} · {label}
          </div>
          <div style={{ color: '#666', fontSize: 9, marginTop: 1 }}>
            ⚡{energyPct} 🧠{knowledge}
          </div>
          <div style={{
            marginTop: 2, fontSize: 9,
            color: palette.color, opacity: 0.7, letterSpacing: 0.5,
          }}>
            {emotionRef.current.current}
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── personality برای deriveEmotion بدون نیاز به API call ─────────────────────
const ROLE_PERSONALITIES = {
  explorer:  { curiosity: 0.9, aggression: 0.2, creativity: 0.5 },
  creator:   { curiosity: 0.5, aggression: 0.1, creativity: 0.9 },
  trader:    { curiosity: 0.4, aggression: 0.6, creativity: 0.3 },
  guardian:  { curiosity: 0.3, aggression: 0.8, creativity: 0.2 },
} as const;
