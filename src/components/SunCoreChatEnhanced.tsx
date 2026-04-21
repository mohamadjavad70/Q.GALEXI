/**
 * Enhanced SunCore Chat with Self-Healing Console Monitor
 * ─────────────────────────────────────────────────────────
 * Integrates 7-step reasoning protocol with real-time error monitoring
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send, Brain, Sparkles, ChevronDown, ChevronUp,
  Cpu, Zap, MessageSquare, Loader2, AlertTriangle,
  CheckCircle, XCircle, Activity,
} from "lucide-react";
import {
  simulateExecutiveReasoning,
  type ExecutiveResponse,
} from "@/lib/sunCorePrompt";
import { logAction } from "@/lib/geneticHash";
import { ChatMessageSchema } from "@/lib/validation";
import { selfHealingMonitor, type ConsoleError } from "@/lib/selfHealingMonitor";
import { qmetaramApi } from "@/lib/qmetaramApi";
import { GlassCard, GlassBadge } from "@/components/ui/glassmorphism";

interface ChatMessage {
  id: number;
  role: "user" | "suncore";
  text: string;
  reasoning?: ExecutiveResponse;
  timestamp: number;
}

let idCounter = 0;

interface SunCoreChatEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SunCoreChatEnhanced({ open, onOpenChange }: SunCoreChatEnhancedProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: ++idCounter,
      role: "suncore",
      text: "Willkommen, Kommandant! 🌸 Ich bin GolGolab — der SunCore-Exekutivkern mit Self-Healing-Funktion.\nGeben Sie jeden Befehl, ich analysiere und führe ihn aus. Ich überwache auch Konsolenfehler.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<number | null>(null);
  const [consoleErrors, setConsoleErrors] = useState<ConsoleError[]>([]);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [activeTab, setActiveTab] = useState<'chat' | 'monitor'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Monitor console errors
  useEffect(() => {
    const unsubscribe = selfHealingMonitor.subscribe((error) => {
      setConsoleErrors(selfHealingMonitor.getUnresolvedErrors());
    });

    // Initial load
    setConsoleErrors(selfHealingMonitor.getUnresolvedErrors());

    return unsubscribe;
  }, []);

  // Check backend status
  useEffect(() => {
    if (open) {
      qmetaramApi.healthCheck().then((result) => {
        setBackendStatus(result.status === 'ok' ? 'online' : 'offline');
      });
    }
  }, [open]);

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
    { pattern: /^(wer bist du|who are you|was bist du)/i, response: "Ich bin GolGolab 🌸 — SunCore Exekutivkern mit Self-Healing. Geben Sie mir jeden Befehl!" },
    { pattern: /^(ok|okay|gut|prima|super|alles klar)/i, response: "Verstanden ✅ Was kommt als nächstes?" },
  ];

  const send = useCallback(async () => {
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
    logAction("suncore_prompt", "golgolab");

    const buildResponse = (reasoning: {
      internalQuestions: Array<{ question: string; answer: string }>;
      finalAnswer: string;
      actionableAnswers: string[];
      relevantApps: Array<{ name: string; category: string; topFeatures: string[] }>;
      followUpQuestion: string;
      strategicQuestions: string[];
    }) => {
      const responseText = `📊 **Exekutive Analyse:**\n${reasoning.internalQuestions.slice(0, 3).map((q) => `• ${q.question} → ${q.answer}`).join("\n")}\n\n🎯 **Endantwort:**\n${reasoning.finalAnswer}\n\n📋 **Empfohlene Maßnahmen:**\n${reasoning.actionableAnswers.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\n${reasoning.relevantApps.length > 0 ? `🛠️ **Relevante Werkzeuge:** ${reasoning.relevantApps.map((a) => a.name).join(" • ")}` : ""}\n\n❓ **${reasoning.followUpQuestion}**`;      const botMsg: ChatMessage = {
        id: ++idCounter,
        role: "suncore",
        text: responseText,
        reasoning: reasoning as ExecutiveResponse,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setThinking(false);
    };

    const runOffline = () => {
      setTimeout(() => {
        const reasoning = simulateExecutiveReasoning(trimmed);
        buildResponse(reasoning);
      }, 600 + Math.random() * 400);
    };

    try {
      if (backendStatus === 'online') {
        try {
          const apiResp = await qmetaramApi.sendChatMessage(trimmed);
          if (apiResp.error) throw new Error(apiResp.error);
          // Wrap plain text response into ExecutiveResponse shape
          const wrapped = simulateExecutiveReasoning(trimmed);
          wrapped.finalAnswer = apiResp.message || wrapped.finalAnswer;
          buildResponse(wrapped);
        } catch {
          runOffline();
        }
      } else {
        runOffline();
      }
    } catch (error) {
      console.error('Chat error:', error);
      runOffline();
    }
  }, [input, thinking, backendStatus]);

  const resolveError = (timestamp: number) => {
    selfHealingMonitor.resolveError(timestamp);
    setConsoleErrors(selfHealingMonitor.getUnresolvedErrors());
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[420px] sm:w-[480px] flex flex-col bg-card/95 backdrop-blur-xl border-border/30 p-0">
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
                  Galaxie-Exekutivkern • Self-Healing AI
                </span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="flex gap-1 mt-2">
            <GlassBadge variant="default" className="text-[8px] gap-1">
              <Brain className="w-2.5 h-2.5" /> 7-Fragen-Reasoning
            </GlassBadge>
            <GlassBadge variant="default" className="text-[8px] gap-1">
              <Activity className="w-2.5 h-2.5" /> Self-Healing
            </GlassBadge>
            <GlassBadge 
              variant={backendStatus === 'online' ? 'success' : backendStatus === 'offline' ? 'error' : 'default'}
              className="text-[8px] gap-1"
            >
              <Cpu className="w-2.5 h-2.5" />
              {backendStatus === 'online' ? 'Backend Online' : backendStatus === 'offline' ? 'Local Mode' : 'Checking...'}
            </GlassBadge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'monitor')} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-2 grid grid-cols-2">
            <TabsTrigger value="chat" className="text-xs">
              <MessageSquare className="w-3 h-3 mr-1" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="monitor" className="text-xs relative">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Monitor
              {consoleErrors.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[8px] flex items-center justify-center">
                  {consoleErrors.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col m-0">
            {/* Messages */}
            <ScrollArea className="flex-1">
              <div ref={scrollRef} className="p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id}>
                    <div className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                      <GlassCard
                        blur="xl"
                        opacity={m.role === "user" ? 30 : 20}
                        className={`max-w-[90%] px-3 py-2 text-sm ${
                          m.role === "user"
                            ? "bg-secondary/20"
                            : "border-primary/20"
                        }`}
                        dir="ltr"
                      >
                        {m.text.split("\n").map((line, i) => (
                          <p key={i} className={line.startsWith("**") ? "font-semibold mt-1" : ""}>
                            {line.replace(/\*\*/g, "")}
                          </p>
                        ))}
                      </GlassCard>
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
                              <GlassCard blur="md" opacity={10} className="mt-2 p-2 space-y-1.5 text-[10px]">
                                <p className="text-muted-foreground font-semibold">🧠 Interne Fragen:</p>
                                {m.reasoning.internalQuestions.map((q, i) => (
                                  <div key={i} className="flex gap-1">
                                    <span className="text-primary">{i + 1}.</span>
                                    <span className="text-foreground">{q.question}</span>
                                    <span className="text-muted-foreground">→ {q.answer}</span>
                                  </div>
                                ))}
                              </GlassCard>
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
                    <GlassCard blur="xl" opacity={20} className="border-primary/20 px-3 py-2 flex items-center gap-2 text-sm">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span className="text-xs" dir="ltr">7-Fragen-Reasoning läuft...</span>
                    </GlassCard>
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
                ⚡ Protokoll: 7 intern → 2 Fragen + 5 Antworten → Endergebnis | Backend: {backendStatus}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="monitor" className="flex-1 m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Console Monitor</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      selfHealingMonitor.clearErrors();
                      setConsoleErrors([]);
                    }}
                  >
                    Clear All
                  </Button>
                </div>

                {consoleErrors.length === 0 ? (
                  <GlassCard blur="md" opacity={10} className="p-6 text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-muted-foreground">No errors detected</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">System running smoothly</p>
                  </GlassCard>
                ) : (
                  consoleErrors.map((error) => {
                    const suggestion = selfHealingMonitor.analyzeError(error);
                    return (
                      <GlassCard key={error.timestamp} blur="md" opacity={20} className="p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground break-words">
                              {error.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(error.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-[10px] space-y-1">
                          <p className="font-semibold text-primary">Diagnosis:</p>
                          <p className="text-muted-foreground">{suggestion.diagnosis}</p>
                          
                          <p className="font-semibold text-primary mt-2">Suggestions:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                            {suggestion.suggestions.slice(0, 2).map((sug, i) => (
                              <li key={i}>{sug}</li>
                            ))}
                          </ul>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => resolveError(error.timestamp)}
                        >
                          Mark as Resolved
                        </Button>
                      </GlassCard>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
