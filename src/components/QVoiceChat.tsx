/**
 * QVoiceChat — چت صوتی با Q Memory
 * ارسال پیام به /chat و ذخیره خودکار در /memory/short
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Brain, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { qmetaramApi } from "@/lib/qmetaramApi";
import { simulateExecutiveReasoning } from "@/lib/sunCorePrompt";

interface Message {
  id: number;
  role: "user" | "bot";
  text: string;
  saved?: boolean;
  timestamp: number;
}

let msgId = 0;
const USER_ID = "qvoice-guest";

interface QVoiceChatProps {
  className?: string;
}

export default function QVoiceChat({ className = "" }: QVoiceChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: ++msgId,
      role: "bot",
      text: "Hallo! Ich bin Q-Voice. Schreiben oder sprechen Sie — Ihre Nachrichten werden im Q-Gedächtnis gespeichert.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [memCount, setMemCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // اسکرول به پایین
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // راه‌اندازی Speech Recognition
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "de-DE";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      if (text) setInput((prev) => (prev + " " + text).trim());
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const sendToQMemory = useCallback(async (userText: string, botText: string) => {
    const key = `voice_${Date.now()}`;
    const value = `Benutzer: ${userText}\nQ: ${botText}`;
    const result = await qmetaramApi.sendToQMemory(key, value, "voice_chat", "short");
    if (result.ok) setMemCount((c) => c + 1);
    return result.ok;
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");

    const userMsg: Message = { id: ++msgId, role: "user", text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    // Quick replies for greetings — instant, no API needed
    const QUICK_REPLIES = [
      { pattern: /^(hallo|hi|hey|guten (morgen|tag|abend)|servus|moin)/i, response: "Hallo! Ich bin Q-Voice. Wie kann ich Ihnen helfen? 🎤" },
      { pattern: /^wie geht(s| es| es dir| es ihnen)/i, response: "Super, danke! Was haben Sie auf dem Herzen? 😊" },
      { pattern: /^(danke|thx|thank|merci|vielen dank)/i, response: "Gern geschehen! 🌸" },
      { pattern: /^(tschüss|bye|auf wiedersehen|ciao)/i, response: "Auf Wiedersehen! 👋" },
      { pattern: /^(ok|okay|gut|prima|super|alles klar)/i, response: "Verstanden ✅" },
    ];
    const quickMatch = QUICK_REPLIES.find(({ pattern }) => pattern.test(text));
    if (quickMatch) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { id: ++msgId, role: "bot", text: quickMatch.response, timestamp: Date.now() }]);
      }, 150 + Math.random() * 100);
      return;
    }

    setThinking(true);
    try {
      const resp = await qmetaramApi.sendChatMessage(text, USER_ID, sessionId);
      if (resp.sessionId) setSessionId(resp.sessionId);

      const botText = resp.error || !resp.message
        ? simulateExecutiveReasoning(text).finalAnswer
        : resp.message;

      const botMsg: Message = {
        id: ++msgId,
        role: "bot",
        text: botText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);

      // Save to Q Memory only if real API responded
      if (!resp.error && resp.message) {
        const saved = await sendToQMemory(text, botText);
        if (saved) {
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsg.id ? { ...m, saved: true } : m))
          );
        }
      }
    } catch {
      // Offline fallback
      const reasoning = simulateExecutiveReasoning(text);
      setMessages((prev) => [
        ...prev,
        { id: ++msgId, role: "bot", text: reasoning.finalAnswer, timestamp: Date.now() },
      ]);
    } finally {
      setThinking(false);
    }
  }, [input, thinking, sessionId, sendToQMemory]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={`flex flex-col bg-card/95 backdrop-blur-xl border border-border/30 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-foreground">Q Voice Chat</span>
        </div>
        <div className="flex items-center gap-2">
          {memCount > 0 && (
            <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/40">
              {memCount} gespeichert
            </Badge>
          )}
          {sessionId && (
            <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/40">
              Online
            </Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-[240px] max-h-[400px]">
        <div ref={scrollRef} className="p-4 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-violet-500/20 text-foreground border border-violet-500/30"
                      : "bg-muted/60 text-foreground border border-border/20"
                  }`}
                >
                  {msg.text}
                  {msg.saved && (
                    <span className="block text-[10px] text-cyan-400/70 mt-1 text-left">
                      ✓ In Q Memory gespeichert
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {thinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-muted/60 border border-border/20 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                <span className="text-xs text-muted-foreground">Verarbeitung läuft...</span>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-border/20">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Nachricht eingeben oder Mikrofon drücken..."
            rows={1}
            className="flex-1 resize-none bg-muted/40 border border-border/30 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 transition-colors min-h-[40px] max-h-[120px]"
            style={{ direction: "ltr" }}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={isListening ? stopListening : startListening}
            className={`shrink-0 rounded-xl h-10 w-10 ${
              isListening
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : "text-muted-foreground hover:text-violet-400"
            }`}
            title={isListening ? "توقف ضبط" : "شروع ضبط صدا"}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="icon"
            onClick={send}
            disabled={!input.trim() || thinking}
            className="shrink-0 rounded-xl h-10 w-10 bg-violet-500/80 hover:bg-violet-500 text-white"
          >
            {thinking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {isListening && (
          <div className="flex items-center gap-1.5 mt-2">
            <Volume2 className="w-3 h-3 text-red-400 animate-pulse" />
            <span className="text-xs text-red-400">در حال گوش دادن...</span>
          </div>
        )}
      </div>
    </div>
  );
}
