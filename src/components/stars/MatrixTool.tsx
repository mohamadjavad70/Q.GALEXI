import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import GeneticHashChip from "@/components/GeneticHashChip";
import { logAction } from "@/lib/geneticHash";

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    const cols = Math.floor(canvas.width / 18);
    const drops = new Array(cols).fill(1);
    const chars = "ابپتثجچحخدذرزسشصضطظعغفقکگلمنوهی01۰۱".split("");

    const interval = setInterval(() => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff41";
      ctx.font = "14px monospace";
      for (let i = 0; i < drops.length; i++) {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 18, drops[i] * 18);
        if (drops[i] * 18 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }, 50);

    return () => { clearInterval(interval); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" />;
}

export default function MatrixTool() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);

  const decode = async () => {
    if (!input.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const words = input.split(/\s+/).length;
    const signals = [
      `📡 سیگنال‌ها: ${Math.min(words, 10)} الگوی شناسایی‌شده`,
      `🔍 تکرارها: ${Math.floor(words / 3)} ساختار تکراری`,
      `⚡ خلاصه: ${input.substring(0, 60)}...`,
      `🧩 پیشنهاد: بازنگری لایه ${Math.floor(Math.random() * 5) + 1}`,
    ];
    setResult(signals.join("\n"));
    const h = await logAction("system-decode", "matrix");
    setHash(h);
    setLoading(false);
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border font-mono">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground text-base">
          <Terminal className="w-5 h-5 text-star-matrix" />
          رمزگشایی سیستم
          <span className="text-xs text-muted-foreground">System Decode</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="متن را وارد کنید..."
          className="bg-input text-foreground min-h-[80px] font-mono"
          dir="rtl"
        />
        <Button onClick={decode} disabled={loading || !input.trim()} className="w-full">
          {loading ? "رمزگشایی..." : "تحلیل سیگنال 🔓"}
        </Button>
        {result && (
          <div className="bg-secondary/50 rounded-lg p-3 text-sm text-star-matrix whitespace-pre-line" dir="rtl">
            {result}
          </div>
        )}
        <GeneticHashChip hash={hash} />
      </CardContent>
    </Card>
  );
}
