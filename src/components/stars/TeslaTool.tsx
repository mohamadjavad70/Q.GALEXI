import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import GeneticHashChip from "@/components/GeneticHashChip";
import { logAction } from "@/lib/geneticHash";

export default function TeslaTool() {
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const steps = [
      `۱. تحلیل اولیه: "${idea.substring(0, 30)}..."`,
      "۲. شناسایی اجزای کلیدی",
      "۳. طراحی معماری سیستم",
      "۴. لیست قطعات: سنسور، پردازشگر، رابط کاربری",
      "۵. ریسک‌ها: پیچیدگی یکپارچه‌سازی، محدودیت منابع",
      "✅ نقشه آماده‌ست!",
    ];
    setResult(steps.join("\n"));
    const h = await logAction("idea-to-blueprint", "tesla");
    setHash(h);
    setLoading(false);
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground text-base">
          <Zap className="w-5 h-5 text-star-tesla" />
          ایده به نقشه
          <span className="text-xs text-muted-foreground">Idea-to-Blueprint</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="ایده‌ات را بنویس..."
          className="bg-input text-foreground min-h-[80px]"
          dir="rtl"
        />
        <Button onClick={analyze} disabled={loading || !idea.trim()} className="w-full">
          {loading ? "در حال تحلیل..." : "تبدیل به نقشه ⚡"}
        </Button>
        {result && (
          <div className="bg-secondary/50 rounded-lg p-3 text-sm text-foreground whitespace-pre-line font-mono" dir="rtl">
            {result}
          </div>
        )}
        <GeneticHashChip hash={hash} />
      </CardContent>
    </Card>
  );
}
