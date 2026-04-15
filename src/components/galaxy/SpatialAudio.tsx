/**
 * SpatialAudioSystem — HRTF Positional Audio Engine
 * Web Audio API + Three.js AudioListener/PositionalAudio
 *
 * Features:
 *  - HRTF panning model for true 3D spatial audio
 *  - Ambient nebula background hum
 *  - Per-star positional sound effects
 *  - Adaptive quality (mobile: lower volume + fewer sources)
 *  - Mute/unmute + volume control
 *  - Cleanup on unmount
 *
 * Usage: Place inside Canvas, attach camera.
 * Expose playStarSound via ref for parent coordination.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const isMobileDevice = (): boolean =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  window.innerWidth < 768;

export interface SpatialAudioHandle {
  playStarSound: (position: THREE.Vector3, type?: string) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
}

interface SpatialAudioSystemProps {
  isMuted?: boolean;
  volume?: number;
  handleRef?: React.MutableRefObject<SpatialAudioHandle | null>;
}

export function SpatialAudioSystem({
  isMuted = false,
  volume = 1.0,
  handleRef,
}: SpatialAudioSystemProps) {
  const { camera } = useThree();
  const listenerRef = useRef<THREE.AudioListener | null>(null);
  const ambientRef = useRef<THREE.Audio | null>(null);
  const activeSoundsRef = useRef<Set<THREE.PositionalAudio>>(new Set());

  // ─── Setup Listener & Ambient ────────────────────────────────────────────

  useEffect(() => {
    const listener = new THREE.AudioListener();
    camera.add(listener);
    listenerRef.current = listener;

    // Ambient nebula hum — only if file exists (graceful fallback)
    const loader = new THREE.AudioLoader();
    loader.load(
      '/sounds/nebula-hum.mp3',
      (buffer) => {
        if (!listenerRef.current) return;
        const ambient = new THREE.Audio(listenerRef.current);
        ambient.setBuffer(buffer);
        ambient.setLoop(true);
        ambient.setVolume(isMuted ? 0 : (isMobileDevice() ? 0.3 : 0.45) * volume);
        ambient.play();
        ambientRef.current = ambient;
      },
      undefined,
      () => {
        // No audio file — silent graceful fallback
        console.debug('[SpatialAudio] nebula-hum.mp3 not found — ambient skipped');
      }
    );

    return () => {
      ambientRef.current?.stop();
      ambientRef.current = null;
      // activeSoundsRef is not a DOM ref — safe to access in cleanup
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const sounds = activeSoundsRef.current;
      sounds.forEach((s) => s.stop());
      sounds.clear();
      const listener = listenerRef.current;
      if (listener) {
        camera.remove(listener);
        listenerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  // ─── Mute / Volume sync ───────────────────────────────────────────────────

  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.setVolume(
        isMuted ? 0 : (isMobileDevice() ? 0.3 : 0.45) * volume
      );
    }
  }, [isMuted, volume]);

  // ─── Star Sound ───────────────────────────────────────────────────────────

  const playStarSound = useCallback(
    (position: THREE.Vector3, type: string = 'star') => {
      if (!listenerRef.current || isMuted) return;

      const loader = new THREE.AudioLoader();
      const filename = `/sounds/${type}-hrtf.mp3`;

      loader.load(
        filename,
        (buffer) => {
          if (!listenerRef.current) return;

          const sound = new THREE.PositionalAudio(listenerRef.current);

          // HRTF config
          const panner = sound.getOutput() as PannerNode;
          try {
            panner.panningModel = 'HRTF';
          } catch {
            panner.panningModel = 'equalpower';
          }
          panner.distanceModel = 'inverse';
          panner.refDistance = 25;
          panner.maxDistance = 180;
          panner.rolloffFactor = 1.8;
          panner.coneInnerAngle = 120;
          panner.coneOuterAngle = 240;
          panner.coneOuterGain = 0.3;

          sound.setBuffer(buffer);
          sound.setVolume(0.8 * volume);

          // Attach to a positional dummy object
          const dummy = new THREE.Object3D();
          dummy.position.copy(position);
          dummy.add(sound);

          sound.play();
          activeSoundsRef.current.add(sound);

          // Auto-cleanup after 8 s
          const cleanup = () => {
            sound.stop();
            dummy.remove(sound);
            activeSoundsRef.current.delete(sound);
          };
          setTimeout(cleanup, 8000);
        },
        undefined,
        () => {
          console.debug(`[SpatialAudio] ${filename} not found — star sound skipped`);
        }
      );
    },
    [isMuted, volume]
  );

  const setMuted = useCallback(
    (muted: boolean) => {
      if (ambientRef.current) {
        ambientRef.current.setVolume(
          muted ? 0 : (isMobileDevice() ? 0.3 : 0.45) * volume
        );
      }
    },
    [volume]
  );

  const setVolume = useCallback(
    (v: number) => {
      if (ambientRef.current && !isMuted) {
        ambientRef.current.setVolume((isMobileDevice() ? 0.3 : 0.45) * v);
      }
    },
    [isMuted]
  );

  // ─── Expose handle ────────────────────────────────────────────────────────

  useEffect(() => {
    if (handleRef) {
      handleRef.current = { playStarSound, setMuted, setVolume };
    }
  }, [handleRef, playStarSound, setMuted, setVolume]);

  return null;
}
