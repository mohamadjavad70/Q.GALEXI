import { useState, useCallback, useEffect } from "react";
import { Mic, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAgent } from "@/context/AgentContext";
import { voiceInteractionService } from "@/voice/VoiceInteractionService";
import { Logger } from "@/services/Logger";

const logger = new Logger();

export default function VoiceExecutiveAssistant() {
  const { agentCore, permission, logger: contextLogger } = useAgent();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("🎤 Voice-first executive assistant ready.");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<"male" | "female">("female");
  const [executionHistory, setExecutionHistory] = useState<Array<{ input: string; output: string; timestamp: number }>>([]);

  useEffect(() => {
    const supported = !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).speechSynthesis
    );
    setVoiceSupported(supported);
  }, []);

  const processRequest = useCallback(
    async (message: string) => {
      if (!message.trim() || !agentCore) return;

      setLoading(true);
      const startTime = Date.now();

      try {
        const result = await agentCore.handle({
          userId: "voice-user",
          intent: "voice-command",
          actionType: "execute",
          payload: { text: message },
        });

        const duration = Date.now() - startTime;
        const response = result.finalResponse || "Request processed";

        setOutput(`✅ ${response}`);
        setExecutionHistory((prev) => [
          ...prev.slice(-9),
          { input: message, output: response, timestamp: Date.now() },
        ]);

        try {
          await voiceInteractionService.speak(response, selectedVoice);
        } catch (e) {
          contextLogger?.warn("Speech synthesis unavailable", {});
        }

        contextLogger?.info("Voice request processed", { input: message, duration });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Request failed";
        setOutput(`❌ ${errorMsg}`);
        contextLogger?.error("Voice request failed", { error: errorMsg });
      } finally {
        setLoading(false);
      }
    },
    [agentCore, selectedVoice, contextLogger]
  );

  const handleVoiceCapture = useCallback(async () => {
    if (!voiceSupported) {
      setOutput("❌ Voice is not supported in your browser");
      return;
    }

    setListening(true);
    try {
      const speech = await voiceInteractionService.startSingleShot("fa-IR");
      setInput(speech.text);
      await processRequest(speech.text);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Voice capture failed";
      setOutput(`❌ ${errorMsg}`);
      contextLogger?.error("Voice capture error", { error: errorMsg });
    } finally {
      setListening(false);
    }
  }, [voiceSupported, processRequest, contextLogger]);

  const handleTextSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
      await processRequest(input);
      setInput("");
    },
    [input, processRequest]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white p-6 flex flex-col items-center justify-center">
      <Card className="w-full max-w-4xl p-8 bg-zinc-900/80 backdrop-blur border-cyan-500/20 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Q.GALEXI Executive Voice Assistant
          </h1>
          <p className="text-sm text-zinc-400">
            🎤 Voice-first | 🛡️ Permission-gated | 💾 Memory-enhanced
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as "male" | "female")}
              className="bg-zinc-700 text-sm px-3 py-1 rounded border border-zinc-600 text-white"
            >
              <option value="female">Female Voice</option>
              <option value="male">Male Voice</option>
            </select>
          </div>
          <div className="text-xs text-zinc-500">
            {voiceSupported ? "✅ Voice supported" : "⚠️ Voice unavailable"}
          </div>
        </div>

        <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 min-h-24 max-h-32 overflow-y-auto">
          <p className="text-sm whitespace-pre-wrap text-zinc-100">{output}</p>
        </div>

        <form onSubmit={handleTextSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || listening}
              placeholder="Enter command or use voice..."
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={loading || listening || !input.trim()}
              className="px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </Button>
          </div>

          <Button
            type="button"
            onClick={handleVoiceCapture}
            disabled={loading || listening || !voiceSupported}
            className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
          >
            {listening || loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Capture Voice Command
              </>
            )}
          </Button>
        </form>

        {executionHistory.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-zinc-700/50">
            <h3 className="text-sm font-semibold text-zinc-300">Recent Executions</h3>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {executionHistory.slice(-3).reverse().map((entry, i) => (
                <div key={i} className="text-xs text-zinc-400 p-2 bg-zinc-800/50 rounded">
                  <div className="font-mono text-cyan-300">&gt; {entry.input}</div>
                  <div className="text-zinc-500">← {entry.output.substring(0, 50)}...</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-zinc-500 text-center pt-2">
          {agentCore ? "✅ Agent connected" : "❌ Agent not ready"} | 
          {permission ? " ✅ Permission layer active" : " ❌ No permissions"}
        </div>
      </Card>
    </div>
  );
}
