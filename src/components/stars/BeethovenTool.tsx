import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Music, Play } from "lucide-react";
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

export default function BeethovenTool() {
  const [text, setText] = useState("");
  const [melody, setMelody] = useState<{ note: string; freq: number }[]>([]);
  const [hash, setHash] = useState("");
  const [playing, setPlaying] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const timeoutRef = useRef<number[]>([]);

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
          متن به ملودی
          <span className="text-xs text-muted-foreground">Text-to-Melody</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
