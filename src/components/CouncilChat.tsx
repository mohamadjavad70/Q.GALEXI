/**
 * Council Consensus Chat (چت اجماعی شورای ۱۲ نفره)
 * ──────────────────────────────────────────────────
 * Each command is analyzed by 12 AI council members.
 * Q-Mother-Core delivers the final response.
 */

import { useState, useRef, useEffect } from "react";
import { processCouncilCommand, COUNCIL_MEMBERS, type ConsensusResult } from "@/lib/councilEngine";
import { Send, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface ChatMessage {
  role: "user" | "council";
  content: string;
  consensus?: ConsensusResult;
  timestamp: number;
}

export default function CouncilChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await processCouncilCommand(text);
      const councilMsg: ChatMessage = {
        role: "council",
        content: result.finalResponse,
        consensus: result,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, councilMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: "council",
        content: "⚠️ خطا در پردازش. لطفاً دوباره تلاش کنید.",
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/30 backdrop-blur-xl rounded-2xl border border-border/20 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/10 flex items-center gap-2">
        <span className="text-lg">👑</span>
        <div>
          <h3 className="text-sm font-bold text-foreground">شورای ۱۲ نفره</h3>
          <p className="text-[9px] text-muted-foreground">Q-Mother-Core Consensus</p>
        </div>
        <div className="mr-auto flex gap-0.5">
          {COUNCIL_MEMBERS.slice(0, 6).map(m => (
            <span key={m.id} className="text-[10px]" title={m.nameFa}>{m.icon}</span>
          ))}
          <span className="text-[10px] text-muted-foreground">+6</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground/40 text-sm">دستور خود را بنویسید...</p>
            <p className="text-muted-foreground/20 text-[10px] mt-1">شورای ۱۲ نفره تحلیل خواهد کرد</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
              msg.role === "user"
                ? "bg-primary/15 text-foreground"
                : "bg-card/50 border border-border/10 text-foreground"
            }`}>
              {msg.role === "council" && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px]">👑</span>
                  <span className="text-[9px] text-primary font-bold">Q-Mother-Core</span>
                  {msg.consensus && (
                    <span className={`text-[8px] px-1.5 rounded-full ${
                      msg.consensus.confidence >= 90 ? "bg-emerald-500/15 text-emerald-400" :
                      msg.consensus.confidence >= 70 ? "bg-amber-500/15 text-amber-400" :
                      "bg-destructive/15 text-destructive"
                    }`}>
                      {msg.consensus.confidence}%
                    </span>
                  )}
                </div>
              )}

              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

              {/* Expandable council votes */}
              {msg.consensus && (
                <div className="mt-2 border-t border-border/10 pt-1.5">
                  <button
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                    className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    📊 نظرات شورا ({msg.consensus.votes.length})
                    {expandedIdx === i ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                  </button>
                  {expandedIdx === i && (
                    <div className="mt-1.5 space-y-1">
                      {msg.consensus.votes.map((vote, vi) => (
                        <div key={vi} className="flex items-start gap-1.5 text-[9px]">
                          <span>{vote.member.icon}</span>
                          <div className="flex-1">
                            <span className="font-medium text-foreground/80">{vote.member.nameFa}</span>
                            <span className={`mr-1 px-1 rounded text-[7px] ${
                              vote.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" :
                              vote.status === "CONCERN" ? "bg-amber-500/10 text-amber-400" :
                              "bg-muted/20 text-muted-foreground"
                            }`}>{vote.status}</span>
                            <p className="text-muted-foreground/60 mt-0.5">{vote.contribution}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-card/50 border border-border/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span className="text-[10px] text-muted-foreground">شورا در حال بررسی...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/10 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="دستور خود را بنویسید..."
          className="flex-1 bg-card/20 text-foreground text-sm px-3 py-2 rounded-lg border border-border/10 placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30"
          dir="rtl"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-3 py-2 bg-primary/15 hover:bg-primary/25 rounded-lg text-primary transition-colors disabled:opacity-30"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
