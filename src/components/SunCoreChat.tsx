import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send, Brain, Sparkles, ChevronDown, ChevronUp,
  Cpu, Zap, MessageSquare, Loader2,
} from "lucide-react";
import {
  simulateExecutiveReasoning,
  type ExecutiveResponse,
  type AppEntry,
} from "@/lib/sunCorePrompt";
import { logAction } from "@/lib/geneticHash";
import { ChatMessageSchema } from "@/lib/validation";

interface ChatMessage {
  id: number;
  role: "user" | "suncore";
  text: string;
  reasoning?: ExecutiveResponse;
  timestamp: number;
}

let idCounter = 0;

interface SunCoreChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SunCoreChat({ open, onOpenChange }: SunCoreChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: ++idCounter,
      role: "suncore",
      text: "Willkommen, Kommandant! 🌸 Ich bin GolGolab — der SunCore-Exekutivkern.\nGeben Sie jeden Befehl, ich analysiere und führe ihn aus.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  // Quick responses for greetings — no reasoning needed
  const QUICK_REPLIES: { pattern: RegExp; response: string }[] = [
    { pattern: /^(hallo|hi|hey|guten (morgen|tag|abend)|servus|moin)/i, response: "Hallo Kommandant! 🌸 Wie kann ich Ihnen heute helfen?" },
    { pattern: /^wie geht(s| es| es dir| es ihnen)/i, response: "Mir geht es ausgezeichnet, danke! 🌸 Was haben Sie auf dem Programm?" },
    { pattern: /^(danke|thx|thank|merci|vielen dank)/i, response: "Gern geschehen, Kommandant! 🌸 Immer für Sie da." },
    { pattern: /^(tschüss|bye|auf wiedersehen|ciao|bis dann)/i, response: "Auf Wiedersehen! 👋 Die Galaxie wartet auf Sie." },
    { pattern: /^(wer bist du|who are you|was bist du)/i, response: "Ich bin GolGolab 🌸 — der SunCore-Exekutivkern. Geben Sie mir jeden Befehl!" },
    { pattern: /^(ok|okay|gut|prima|super|alles klar)/i, response: "Verstanden ✅ Was kommt als nächstes?" },
  ];

  const send = useCallback(() => {
    if (thinking) return;
    const parsed = ChatMessageSchema.safeParse(input);
    if (!parsed.success) return;
    const trimmed = parsed.data;

    const userMsg: ChatMessage = {
      id: ++idCounter,
      role: "user",
      text: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    logAction("suncore_prompt", "golgolab");

    // Check for quick greeting first
    const quickMatch = QUICK_REPLIES.find(({ pattern }) => pattern.test(trimmed.trim()));
    if (quickMatch) {
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: ++idCounter,
          role: "suncore",
          text: quickMatch.response,
          timestamp: Date.now(),
        }]);
      }, 200 + Math.random() * 150);
      return;
    }

    setThinking(true);
    setTimeout(() => {
      try {
        const reasoning = simulateExecutiveReasoning(trimmed);
        const responseText = `🎯 **Endantwort:**\n${reasoning.finalAnswer}\n\n📋 **Maßnahmen:**\n${reasoning.actionableAnswers.slice(0, 3).map((a, i) => `${i + 1}. ${a}`).join("\n")}${reasoning.relevantApps.length > 0 ? `\n\n🛠️ ${reasoning.relevantApps.slice(0, 3).map((a) => a.name).join(" • ")}` : ""}\n\n❓ ${reasoning.followUpQuestion}`;

        const botMsg: ChatMessage = {
          id: ++idCounter,
          role: "suncore",
          text: responseText,
          reasoning,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch {
        setMessages((prev) => [...prev, {
          id: ++idCounter,
          role: "suncore",
          text: "⚠️ Fehler bei der Verarbeitung. Bitte erneut versuchen.",
          timestamp: Date.now(),
        }]);
      } finally {
        setThinking(false);
      }
    }, 700 + Math.random() * 400);
  }, [input, thinking]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[380px] sm:w-[420px] flex flex-col bg-card/95 backdrop-blur-xl border-border/30 p-0">
        {/* Header */}
        <div className="p-4 border-b border-border/20">
          <SheetHeader>
            <SheetTitle className="text-foreground flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                🌸
              </div>
              <div>
                <span className="block">GolGolab — SunCore Exekutiv</span>
                <span className="block text-[10px] text-muted-foreground font-normal">
                  Galaxie-Exekutivkern • 7-Fragen-Protokoll
                </span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="flex gap-1 mt-2">
            <Badge variant="outline" className="text-[8px] gap-1">
              <Brain className="w-2.5 h-2.5" /> 7-Fragen-Reasoning
            </Badge>
            <Badge variant="outline" className="text-[8px] gap-1">
              <Cpu className="w-2.5 h-2.5" /> Werkzeuganalyse
            </Badge>
            <Badge variant="outline" className="text-[8px] gap-1">
              <Zap className="w-2.5 h-2.5" /> Exekutiv
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div ref={scrollRef} className="p-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id}>
                <div className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary/10 text-foreground border border-primary/20"
                    }`}
                    dir="ltr"
                  >
                    {m.text.split("\n").map((line, i) => (
                      <p key={i} className={line.startsWith("**") ? "font-semibold mt-1" : ""}>
                        {line.replace(/\*\*/g, "")}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Reasoning expandable */}
                {m.reasoning && (
                  <div className="mt-1 mr-4" dir="ltr">
                    <button
                      onClick={() => setExpandedReasoning(expandedReasoning === m.id ? null : m.id)}
                      className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <Brain className="w-3 h-3" />
                      7-Fragen-Reasoning-Prozess anzeigen
                      {expandedReasoning === m.id ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                    <AnimatePresence>
                      {expandedReasoning === m.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 p-2 bg-secondary/30 rounded-lg space-y-1.5 text-[10px]">
                            <p className="text-muted-foreground font-semibold">🧠 Interne Fragen:</p>
                            {m.reasoning.internalQuestions.map((q, i) => (
                              <div key={i} className="flex gap-1">
                                <span className="text-primary">{i + 1}.</span>
                                <span className="text-foreground">{q.question}</span>
                                <span className="text-muted-foreground">→ {q.answer}</span>
                              </div>
                            ))}
                            <div className="border-t border-border/20 pt-1 mt-1">
                              <p className="text-muted-foreground font-semibold">🔍 Strategische Fragen:</p>
                              {m.reasoning.strategicQuestions.map((q, i) => (
                                <p key={i} className="text-foreground">• {q}</p>
                              ))}
                            </div>
                            {m.reasoning.relevantApps.length > 0 && (
                              <div className="border-t border-border/20 pt-1 mt-1">
                                <p className="text-muted-foreground font-semibold">🛠️ Analysierte Werkzeuge:</p>
                                {m.reasoning.relevantApps.map((app, i) => (
                                  <div key={i} className="flex gap-1 items-start">
                                    <span className="text-primary">•</span>
                                    <span className="text-foreground font-medium">{app.name}:</span>
                                    <span className="text-muted-foreground">
                                      {app.topFeatures.join(" • ")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {thinking && (
              <div className="flex justify-end">
                <div className="bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-xs" dir="ltr">7-Fragen-Reasoning läuft...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border/20 space-y-2">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Exekutivbefehl eingeben..."
              className="flex-1 bg-input/50 text-foreground min-h-[44px] max-h-[120px] resize-none text-sm"
              dir="ltr"
              rows={2}
            />
            <Button
              size="icon"
              onClick={send}
              disabled={thinking || !input.trim()}
              className="self-end h-10 w-10"
            >
              {thinking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[9px] text-muted-foreground/50 text-center" dir="ltr">
            ⚡ Protokoll: 7 intern → 2 Fragen + 5 Antworten → Endergebnis | Cloud erforderlich für echte AI
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
