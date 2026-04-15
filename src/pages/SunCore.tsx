import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send, Brain, Sparkles, ChevronDown, ChevronUp,
  Cpu, Zap, Loader2, ArrowRight, Terminal,
  Activity, Shield, Eye, Orbit,
} from "lucide-react";
import {
  simulateExecutiveReasoning,
  type ExecutiveResponse,
} from "@/lib/sunCorePrompt";
import { logAction, getLedger } from "@/lib/geneticHash";
import { ChatMessageSchema } from "@/lib/validation";

/* ── types ── */
interface ChatMessage {
  id: number;
  role: "user" | "suncore";
  text: string;
  reasoning?: ExecutiveResponse;
  timestamp: number;
}

let idCounter = 0;

/* ── Quick-action chips ── */
const QUICK_ACTIONS = [
  { label: "Generate", icon: "✦", cmd: "Generate a new star for DeepSeek AI" },
  { label: "Re-Orbit", icon: "⟳", cmd: "Re-Orbit all planets based on trust score" },
  { label: "Verify", icon: "🛡", cmd: "Verify security of all active links" },
  { label: "Quarantine", icon: "⚠", cmd: "Quarantine suspicious planets" },
];

export default function SunCore() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: ++idCounter,
      role: "suncore",
      text: "سلام فرمانده! 🌸\nمن گل‌گلاب هستم — هسته اجرایی SunCore.\n\nهر دستوری بده. پروتکل ۷ سوالی فعال است.\nاز دکمه‌های سریع پایین هم می‌تونی استفاده کنی.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ledger = getLedger();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = useCallback(
    (override?: string) => {
      if (thinking) return;
      const raw = override ?? input;
      const parsed = ChatMessageSchema.safeParse(raw);
      if (!parsed.success) return;
      const trimmed = parsed.data;

      setMessages((prev) => [
        ...prev,
        { id: ++idCounter, role: "user", text: trimmed, timestamp: Date.now() },
      ]);
      setInput("");
      setThinking(true);
      logAction("suncore_exec", "golgolab");

      setTimeout(() => {
        const reasoning = simulateExecutiveReasoning(trimmed);
        const responseText = buildResponse(reasoning);
        setMessages((prev) => [
          ...prev,
          { id: ++idCounter, role: "suncore", text: responseText, reasoning, timestamp: Date.now() },
        ]);
        setThinking(false);
      }, 1200 + Math.random() * 800);
    },
    [input, thinking],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen flex flex-col bg-background overflow-hidden"
      dir="rtl"
    >
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border/20 bg-card/60 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-muted-foreground">
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-lg">
              🌸
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">SunCore Executive</h1>
              <p className="text-[10px] text-muted-foreground">هسته اجرایی کهکشان • فرمانده</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[8px] gap-1 border-primary/30 text-primary">
            <Brain className="w-2.5 h-2.5" /> 7Q Protocol
          </Badge>
          <Badge variant="outline" className="text-[8px] gap-1 border-accent/30 text-accent">
            <Zap className="w-2.5 h-2.5" /> Executive
          </Badge>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse ml-1" title="آنلاین" />
        </div>
      </header>

      {/* ── Main area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Chat column ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="p-4 space-y-4 max-w-3xl mx-auto">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  msg={m}
                  expanded={expandedId === m.id}
                  onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
                />
              ))}

              {thinking && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <div className="space-y-1">
                      <span className="text-xs text-foreground block">در حال استدلال ۷ سوالی...</span>
                      <div className="flex gap-1">
                        {[...Array(7)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary/40"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.4, delay: i * 0.15, repeat: Infinity }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* ── Quick actions ── */}
          <div className="px-4 py-2 border-t border-border/10 bg-card/30 shrink-0">
            <div className="flex gap-2 overflow-x-auto max-w-3xl mx-auto pb-1">
              {QUICK_ACTIONS.map((qa) => (
                <Button
                  key={qa.label}
                  variant="outline"
                  size="sm"
                  className="text-[10px] gap-1 shrink-0 border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  onClick={() => send(qa.cmd)}
                  disabled={thinking}
                >
                  <span>{qa.icon}</span>
                  {qa.label}
                </Button>
              ))}
            </div>
          </div>

          {/* ── Input ── */}
          <div className="px-4 py-3 border-t border-border/20 bg-card/50 backdrop-blur-sm shrink-0">
            <div className="flex gap-2 max-w-3xl mx-auto">
              <div className="flex-1 relative">
                <Terminal className="absolute right-3 top-3 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="دستور اجرایی خود را وارد کنید..."
                  className="pr-9 bg-input/60 text-foreground min-h-[48px] max-h-[140px] resize-none text-sm rounded-xl border-border/30 focus:border-primary/50"
                  dir="rtl"
                  rows={2}
                />
              </div>
              <Button
                size="icon"
                onClick={() => send()}
                disabled={thinking || !input.trim()}
                className="self-end h-12 w-12 rounded-xl"
              >
                {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground/40 text-center mt-1.5 max-w-3xl mx-auto">
              ⚡ ۷ سوال داخلی → تحلیل ابزار → ۲ سوال استراتژیک + ۵ پاسخ → خروجی نهایی
            </p>
          </div>
        </div>

        {/* ── Side panel: mini audit log ── */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border/15 bg-card/30 backdrop-blur-sm shrink-0">
          <div className="p-3 border-b border-border/15">
            <h2 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              Audit Log
            </h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {ledger.length === 0 ? (
                <p className="text-[10px] text-muted-foreground p-2">هنوز فعالیتی ثبت نشده</p>
              ) : (
                [...ledger]
                  .reverse()
                  .slice(0, 25)
                  .map((entry, i) => (
                    <div
                      key={i}
                      className="p-1.5 rounded bg-secondary/15 text-[9px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-medium">{entry.action}</span>
                        <span className="font-mono text-muted-foreground">{entry.hash.slice(0, 6)}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>{entry.starSlug}</span>
                        <span>{new Date(entry.timestamp).toLocaleTimeString("fa-IR")}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </ScrollArea>
          <div className="p-2 border-t border-border/15">
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>{ledger.length} عمل ثبت‌شده</span>
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

/* ── Message bubble component ── */
function MessageBubble({
  msg,
  expanded,
  onToggle,
}: {
  msg: ChatMessage;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isUser = msg.role === "user";

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
        <div
          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-secondary/60 text-secondary-foreground rounded-tr-sm"
              : "bg-primary/5 text-foreground border border-primary/15 rounded-tl-sm"
          }`}
        >
          {msg.text.split("\n").map((line, i) => {
            const isBold = line.includes("**");
            const emojiPrefixes = ["📊", "🎯", "📋", "🛠️", "❓", "⚡", "✦"];
            const isEmoji = emojiPrefixes.some((prefix) => line.trim().startsWith(prefix));
            return (
              <p
                key={i}
                className={`${isBold ? "font-semibold mt-1.5" : ""} ${isEmoji ? "mt-2" : ""} ${
                  line.trim() === "" ? "h-2" : ""
                }`}
              >
                {line.replace(/\*\*/g, "")}
              </p>
            );
          })}
        </div>
      </div>

      {/* Reasoning accordion */}
      {msg.reasoning && (
        <div className="mt-1.5 mr-4">
          <button
            onClick={onToggle}
            className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors group"
          >
            <Brain className="w-3 h-3 group-hover:text-primary" />
            <span>مشاهده فرآیند استدلال ۷ سوالی</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-3 bg-secondary/20 rounded-xl border border-border/10 space-y-2 text-[10px]">
                  <p className="text-muted-foreground font-semibold flex items-center gap-1">
                    <Eye className="w-3 h-3" /> سوالات داخلی (7Q):
                  </p>
                  {msg.reasoning.internalQuestions.map((q, i) => (
                    <div key={i} className="flex gap-1.5 items-start">
                      <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                      <span className="text-foreground">{q.question}</span>
                      <span className="text-muted-foreground mr-auto shrink-0">← {q.answer}</span>
                    </div>
                  ))}

                  <div className="border-t border-border/10 pt-2">
                    <p className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Orbit className="w-3 h-3" /> سوالات استراتژیک:
                    </p>
                    {msg.reasoning.strategicQuestions.map((q, i) => (
                      <p key={i} className="text-foreground">• {q}</p>
                    ))}
                  </div>

                  {msg.reasoning.relevantApps.length > 0 && (
                    <div className="border-t border-border/10 pt-2">
                      <p className="text-muted-foreground font-semibold flex items-center gap-1">
                        <Cpu className="w-3 h-3" /> ابزارهای تحلیل‌شده:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {msg.reasoning.relevantApps.map((app, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-[8px] border-primary/20 text-primary/80"
                          >
                            {app.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

/* ── Response builder ── */
function buildResponse(r: ExecutiveResponse): string {
  const lines = [
    `📊 **تحلیل اجرایی:**`,
    ...r.internalQuestions.slice(0, 3).map((q) => `  • ${q.question} → ${q.answer}`),
    ``,
    `🎯 **پاسخ نهایی:**`,
    r.finalAnswer,
    ``,
    `📋 **اقدامات پیشنهادی:**`,
    ...r.actionableAnswers.map((a, i) => `  ${i + 1}. ${a}`),
  ];

  if (r.relevantApps.length > 0) {
    lines.push(``, `🛠️ **ابزارها:** ${r.relevantApps.map((a) => a.name).join(" · ")}`);
  }

  lines.push(``, `❓ **${r.followUpQuestion}**`);

  return lines.join("\n");
}
