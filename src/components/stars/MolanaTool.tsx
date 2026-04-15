import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import GeneticHashChip from "@/components/GeneticHashChip";
import { logAction } from "@/lib/geneticHash";

const tones = ["آرامش", "شوق", "اندوه لطیف", "امید", "عشق", "تأمل"];
const angles = [
  "هر رنجی، پلی‌ست به سوی روشنایی.",
  "در دل هر سکوتی، هزار آواز نهفته است.",
  "عشق، تنها زبانی‌ست که همه می‌فهمند.",
  "تو خود، کتابی هستی که هنوز خوانده نشده.",
  "هر قدمی که برمی‌داری، راهی تازه می‌سازی.",
];

export default function MolanaTool() {
  const [thought, setThought] = useState("");
  const [result, setResult] = useState<{ tone: string; angle: string; step: string } | null>(null);
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!thought.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setResult({
      tone: tones[Math.floor(Math.random() * tones.length)],
      angle: angles[Math.floor(Math.random() * angles.length)],
      step: "نفس عمیق بکش. یک قدم کوچک بردار. با خودت مهربان باش.",
    });
    const h = await logAction("emotion-lens", "molana");
    setHash(h);
    setLoading(false);
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground text-base">
          <Heart className="w-5 h-5 text-star-molana" />
          لنز احساس و معنا
          <span className="text-xs text-muted-foreground">Emotion & Meaning</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={thought}
          onChange={(e) => setThought(e.target.value)}
          placeholder="فکرت رو اینجا بنویس..."
          className="bg-input text-foreground min-h-[80px]"
          dir="rtl"
        />
        <Button onClick={analyze} disabled={loading || !thought.trim()} className="w-full">
          {loading ? "در حال تأمل..." : "تحلیل احساس 🌹"}
        </Button>
        {result && (
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm" dir="rtl">
            <p><span className="text-star-molana font-bold">🎭 تُن احساسی:</span> {result.tone}</p>
            <p><span className="text-star-molana font-bold">🔮 زاویه فلسفی:</span> {result.angle}</p>
            <p><span className="text-star-molana font-bold">🌿 قدم بعدی:</span> {result.step}</p>
            <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-2">
              ⚠️ این ابزار جایگزین مشاوره تخصصی نیست. با احترام و بدون ادعای پزشکی.
            </p>
          </div>
        )}
        <GeneticHashChip hash={hash} />
      </CardContent>
    </Card>
  );
}
