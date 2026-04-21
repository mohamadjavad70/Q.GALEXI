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
  { fa: "Gutes Denken", en: "Good Thoughts" },
  { fa: "Gute Worte", en: "Good Words" },
  { fa: "Gute Taten", en: "Good Deeds" },
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
    if (!allChecked) { setError("Bitte alle Regeln akzeptieren"); return; }
    if (!intentValid) { setError("Ziel eingeben (mindestens 3 Zeichen)"); return; }
    if (blockedPatterns.test(intent)) {
      setError("Unangemessener Inhalt erkannt. Bitte mit konstruktiver Absicht umformulieren.");
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
              <CardContent className="p-6 space-y-5" dir="ltr">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground">Q-Tor</h2>
                  <p className="text-xs text-muted-foreground mt-1">Q Gate</p>
                  <Badge variant="outline" className="mt-2 text-muted-foreground text-[10px]">
                    Demo gate (client-side)
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  {purpose === "q-core"
                    ? "Um das stille Zimmer zu betreten, akzeptieren Sie die galaktischen Regeln."
                    : "Um einen neuen Planeten zu erstellen, akzeptieren Sie die galaktischen Regeln."}
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
                    Was ist mein Ziel beim {purpose === "q-core" ? "Betreten" : "Erstellen"}?
                  </label>
                  <Textarea
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    placeholder="Ihr Ziel kurz eingeben..."
                    className="bg-input text-foreground resize-none h-20"
                    dir="ltr"
                    maxLength={200}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <div className="flex gap-3 justify-center">
                  <Button onClick={handleSubmit} disabled={!allChecked || !intentValid}>
                    Passieren
                  </Button>
                  <Button variant="outline" onClick={onClose}>Abbrechen</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
