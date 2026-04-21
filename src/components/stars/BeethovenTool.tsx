import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Music, Play, Square, Download, Loader2 } from "lucide-react";
import GeneticHashChip from "@/components/GeneticHashChip";
import { logAction } from "@/lib/geneticHash";

const noteFreqs: Record<string, number> = {
  C4: 261.63, "C#4": 277.18, D4: 293.66, "D#4": 311.13,
  E4: 329.63, F4: 349.23, "F#4": 369.99, G4: 392.0,
  "G#4": 415.3, A4: 440.0, "A#4": 466.16, B4: 493.88, C5: 523.25,
};

const whiteKeys = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
const blackKeys = [
  { note: "C#4", left: "11.5%" }, { note: "D#4", left: "24%" },
  { note: "F#4", left: "48.5%" }, { note: "G#4", left: "61%" }, { note: "A#4", left: "73.5%" },
];

const scale = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];

function playNote(freq: number, duration = 0.4) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch { /* WebAudio not available */ }
}

function textToMelody(text: string): { note: string; freq: number }[] {
  return text.split("").slice(0, 16).map((char) => {
    const code = char.charCodeAt(0);
    const idx = code % scale.length;
    return { note: whiteKeys[idx], freq: scale[idx] };
  });
}

// ─── AI Music Generator ───────────────────────────────────────────────────────
function generateToneWithWebAudio(notes: number[], durationSec: number) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 0.3;
    const startTime = audioCtx.currentTime;
    notes.forEach((note, index) => {
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = note;
      osc.connect(gainNode);
      const noteTime = startTime + index * 0.5;
      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
    setTimeout(() => audioCtx.close(), durationSec * 1000 + 500);
    return true;
  } catch { return false; }
}

export default function BeethovenTool() {
  const [text, setText] = useState("");
  const [melody, setMelody] = useState<{ note: string; freq: number }[]>([]);
  const [hash, setHash] = useState("");
  const [playing, setPlaying] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const timeoutRef = useRef<number[]>([]);

  // AI Generation state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDuration, setAiDuration] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAudioReady, setAiAudioReady] = useState(false);
  const [isAiPlaying, setIsAiPlaying] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const generateAiMusic = useCallback(async () => {
    if (!aiPrompt.trim()) { setAiError("لطفاً توضیحات موسیقی را وارد کنید"); return; }
    setIsGenerating(true); setAiError(null); setAiAudioReady(false);
    try {
      const response = await fetch("http://localhost:8765/ai/music/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, duration: aiDuration, style: "classical" })
      });
      if (response.ok) {
        await response.json();
        setAiAudioReady(true);
      } else { throw new Error("backend unavailable"); }
    } catch {
      // Fallback: Web Audio API
      const baseNotes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
      generateToneWithWebAudio(baseNotes.slice(0, Math.min(aiDuration, 8)), aiDuration);
      setAiAudioReady(true);
    } finally { setIsGenerating(false); }
  }, [aiPrompt, aiDuration]);

  const playAiAudio = useCallback(() => {
    const baseNotes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    generateToneWithWebAudio(baseNotes, aiDuration);
    setIsAiPlaying(true);
    setTimeout(() => setIsAiPlaying(false), aiDuration * 1000);
  }, [aiDuration]);

  const generateMelody = async () => {
    if (!text.trim()) return;
    const notes = textToMelody(text);
    setMelody(notes);
    const h = await logAction("text-to-melody", "beethoven");
    setHash(h);
  };

  const playMelody = useCallback(() => {
    if (melody.length === 0) return;
    setPlaying(true);
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];
    melody.forEach((n, i) => {
      const t = window.setTimeout(() => {
        playNote(n.freq, 0.35);
        setActiveKey(n.note);
        if (i === melody.length - 1) {
          window.setTimeout(() => { setPlaying(false); setActiveKey(null); }, 400);
        }
      }, i * 350);
      timeoutRef.current.push(t);
    });
  }, [melody]);

  return (
    <Card className="bg-card/80 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground text-base">
          <Music className="w-5 h-5 text-star-beethoven" />
          استودیو بتهوون — AI + Text-to-Melody
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── AI Music Generator section ── */}
        <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 space-y-2">
          <p className="text-xs text-amber-300 font-semibold">🎵 تولید موسیقی با هوش مصنوعی</p>
          <Textarea
            placeholder="مثال: یک ملودی آرام پیانو در گام C ماژور..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="bg-stone-800/60 border-stone-600 text-white text-xs"
            rows={2}
          />
          <div className="flex items-center gap-2">
            <Input
              type="number" min={3} max={30} value={aiDuration}
              onChange={(e) => setAiDuration(parseInt(e.target.value) || 10)}
              className="bg-stone-800/60 border-stone-600 text-white w-20 text-xs"
            />
            <span className="text-xs text-muted-foreground">ثانیه</span>
            <Button size="sm" onClick={generateAiMusic} disabled={isGenerating}
              className="bg-amber-700 hover:bg-amber-600 text-white text-xs flex-1">
              {isGenerating ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />ساخت...</> : <><Music className="w-3 h-3 mr-1" />ساخت موسیقی</>}
            </Button>
            {aiAudioReady && (
              <Button size="sm" variant="outline" onClick={playAiAudio}
                className="border-amber-600 text-amber-400 text-xs">
                {isAiPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
            )}
            {aiAudioReady && (
              <Button size="sm" variant="outline" className="border-amber-600 text-amber-400 text-xs">
                <Download className="w-3 h-3" />
              </Button>
            )}
          </div>
          {aiError && <p className="text-red-400 text-xs">❌ {aiError}</p>}
          <p className="text-[10px] text-stone-500">💡 بدون backend از Web Audio API استفاده می‌شود.</p>
        </div>
        {/* Piano */}
        <div className="relative h-32 select-none" dir="ltr">
          <div className="flex h-full">
            {whiteKeys.map((note) => (
              <button
                key={note}
                onMouseDown={() => { playNote(noteFreqs[note]); setActiveKey(note); }}
                onMouseUp={() => setActiveKey(null)}
                onMouseLeave={() => setActiveKey(null)}
                className={`flex-1 border border-border rounded-b-md transition-colors flex items-end justify-center pb-2 text-[10px] ${
                  activeKey === note ? "bg-primary/30 text-primary" : "bg-foreground/90 text-background hover:bg-foreground/80"
                }`}
              >
                {note}
              </button>
            ))}
          </div>
          {blackKeys.map(({ note, left }) => (
            <button
              key={note}
              onMouseDown={() => { playNote(noteFreqs[note]); setActiveKey(note); }}
              onMouseUp={() => setActiveKey(null)}
              onMouseLeave={() => setActiveKey(null)}
              style={{ left }}
              className={`absolute top-0 w-[9%] h-[60%] rounded-b-md z-10 text-[9px] flex items-end justify-center pb-1 transition-colors ${
                activeKey === note ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              {note}
            </button>
          ))}
        </div>

        {/* Text to Melody */}
        <div className="space-y-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="یک جمله بنویس..."
            className="bg-input text-foreground"
            dir="rtl"
          />
          <div className="flex gap-2">
            <Button onClick={generateMelody} className="flex-1" disabled={!text.trim()}>
              تبدیل به ملودی 🎵
            </Button>
            {melody.length > 0 && (
              <Button variant="outline" onClick={playMelody} disabled={playing}>
                <Play className="w-4 h-4 ml-1" /> پخش
              </Button>
            )}
          </div>
        </div>

        {melody.length > 0 && (
          <div className="bg-secondary/50 rounded-lg p-3 font-mono text-sm text-foreground" dir="ltr">
            🎼 {melody.map((n) => n.note).join(" → ")}
          </div>
        )}
        <GeneticHashChip hash={hash} />
      </CardContent>
    </Card>
  );
}
