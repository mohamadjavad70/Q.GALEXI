import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Web Audio ambient oscillator pad for the solar system.
 * Creates a layered drone with subtle detuning and slow LFO modulation.
 */
export function useAmbientPad(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const oscsRef = useRef<OscillatorNode[]>([]);
  const [started, setStarted] = useState(false);

  const start = useCallback(() => {
    if (ctxRef.current) return;
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.12;
    master.connect(ctx.destination);
    gainRef.current = master;

    // Layer config: frequency, detune, type
    const layers: [number, number, OscillatorType][] = [
      [55, 0, "sine"],        // deep bass A1
      [82.41, 5, "sine"],     // E2 slightly sharp
      [110, -3, "triangle"],  // A2
      [164.81, 7, "sine"],    // E3
      [220, -5, "sine"],      // A3 (faint)
    ];

    const oscs: OscillatorNode[] = [];

    layers.forEach(([freq, detune, type], i) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;

      // Per-voice gain (higher voices quieter)
      const vGain = ctx.createGain();
      vGain.gain.value = 0.25 / (1 + i * 0.6);

      // Slow LFO on volume for organic feel
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.05 + i * 0.02; // very slow
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = vGain.gain.value * 0.3;
      lfo.connect(lfoGain);
      lfoGain.connect(vGain.gain);
      lfo.start();

      osc.connect(vGain);
      vGain.connect(master);
      osc.start();
      oscs.push(osc);
    });

    oscsRef.current = oscs;
    setStarted(true);
  }, [muted]);

  // Fade gain on mute toggle
  useEffect(() => {
    const gain = gainRef.current;
    const ctx = ctxRef.current;
    if (!gain || !ctx) return;
    const target = muted ? 0 : 0.12;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setTargetAtTime(target, ctx.currentTime, 0.4);
  }, [muted]);

  // Cleanup
  useEffect(() => {
    return () => {
      oscsRef.current.forEach((o) => {
        try {
          o.stop();
        } catch {
          void 0;
        }
      });
      ctxRef.current?.close();
      ctxRef.current = null;
      gainRef.current = null;
      oscsRef.current = [];
    };
  }, []);

  return { started, start };
}
