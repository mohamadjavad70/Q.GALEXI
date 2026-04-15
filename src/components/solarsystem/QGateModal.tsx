import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

/**
 * QGateModal — Safety gate requiring acknowledgement of galactic rules
 * before entering Q Core or creating planet seeds.
 */

const rules = [
  { fa: "پندار نیک", en: "Good Thoughts" },
  { fa: "گفتار نیک", en: "Good Words" },
  { fa: "کردار نیک", en: "Good Deeds" },
];

// Lightweight safety rubric (client-side only)
const blockedPatterns = /خشونت|نفرت|تروریسم|violence|hatred|terrorism|kill|destroy/i;

interface QGateModalProps {
  open: boolean;
  purpose: "q-core" | "planet-seed";
  onClose: () => void;
  onPass: () => void;
}

export default function QGateModal({ open, purpose, onClose, onPass }: QGateModalProps) {
  const [checks, setChecks] = useState([false, false, false]);
  const [intent, setIntent] = useState("");
  const [error, setError] = useState("");

  const allChecked = checks.every(Boolean);
  const intentValid = intent.trim().length >= 3;

  const handleSubmit = () => {
    setError("");
    if (!allChecked) { setError("لطفاً همه قوانین را بپذیرید"); return; }
    if (!intentValid) { setError("هدف خود را بنویسید (حداقل ۳ حرف)"); return; }
    if (blockedPatterns.test(intent)) {
      setError("محتوای نامناسب شناسایی شد. لطفاً با نیت سازنده بازنویسی کنید.");
      return;
    }
    onPass();
  };

  const toggle = (i: number) => {
    const next = [...checks];
    next[i] = !next[i];
    setChecks(next);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] bg-background/85 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-md bg-card border-border">
              <CardContent className="p-6 space-y-5" dir="rtl">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground">دروازه Q</h2>
                  <p className="text-xs text-muted-foreground mt-1">Q Gate</p>
                  <Badge variant="outline" className="mt-2 text-muted-foreground text-[10px]">
                    Demo gate (client-side)
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  {purpose === "q-core"
                    ? "برای ورود به اتاق آرام، قوانین کهکشانی را بپذیرید."
                    : "برای ساخت سیاره جدید، قوانین کهکشانی را بپذیرید."}
                </p>

                {/* Rules */}
                <div className="space-y-3">
                  {rules.map((r, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox checked={checks[i]} onCheckedChange={() => toggle(i)} />
                      <span className="text-foreground font-medium">{r.fa}</span>
                      <span className="text-muted-foreground text-xs">({r.en})</span>
                    </label>
                  ))}
                </div>

                {/* Intent */}
                <div>
                  <label className="text-sm text-foreground font-medium block mb-1">
                    هدف من از {purpose === "q-core" ? "ورود" : "ساخت"} چیست؟
                  </label>
                  <Textarea
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    placeholder="هدف خود را به اختصار بنویسید..."
                    className="bg-input text-foreground resize-none h-20"
                    dir="rtl"
                    maxLength={200}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <div className="flex gap-3 justify-center">
                  <Button onClick={handleSubmit} disabled={!allChecked || !intentValid}>
                    عبور
                  </Button>
                  <Button variant="outline" onClick={onClose}>انصراف</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
