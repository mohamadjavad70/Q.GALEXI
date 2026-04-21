// ─── Collective Memory — نمایش حافظه مشترک سیاره ────────────────────────────
import { useEffect, useState } from 'react';

interface MemoryNode {
  id: string;
  type: 'agent' | 'planet' | 'user' | 'event';
  content: string;
  emotion: string;
  timestamp: number;
  importance: number;
  planetId?: string;
  agentId?: string;
}

const EMOTION_ICON: Record<string, string> = {
  calm: '😌', curious: '🤔', excited: '🎉', tired: '😴',
  aggressive: '😠', fearful: '😨', positive: '✅', negative: '❌', neutral: '😐',
};

const TYPE_ICON: Record<string, string> = {
  agent: '🤖', planet: '🌍', user: '👤', event: '⚡',
};

const API_BASE = import.meta.env.VITE_Q_API_URL ?? 'http://localhost:3001';

interface CollectiveMemoryProps {
  planetId: string;
}

export function CollectiveMemory({ planetId }: CollectiveMemoryProps) {
  const [memories, setMemories] = useState<MemoryNode[]>([]);
  const [trend, setTrend] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const fetchMemories = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/memory/planet/${encodeURIComponent(planetId)}?limit=20`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          memories: MemoryNode[];
          trend: Record<string, number>;
        };
        if (alive) {
          setMemories(data.memories ?? []);
          setTrend(data.trend ?? {});
          setLoading(false);
        }
      } catch {
        /* silent */
      }
    };

    void fetchMemories();
    const interval = setInterval(() => void fetchMemories(), 10_000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [planetId]);

  return (
    <div className="bg-black/50 backdrop-blur rounded-xl p-4 border border-purple-500/30 text-white">
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span className="text-purple-400">🧠</span>
        Collective Memory
        {loading && (
          <span className="text-xs text-gray-500 animate-pulse mr-2">بارگذاری...</span>
        )}
      </h3>

      {/* Emotional Trend */}
      {Object.keys(trend).length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">روند احساسی ۲۴ ساعته</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(trend).map(([emotion, count]) => (
              <div
                key={emotion}
                className="flex items-center gap-1 bg-purple-900/30 rounded px-2 py-1 text-xs"
              >
                <span>{EMOTION_ICON[emotion] ?? '❓'}</span>
                <span className="text-purple-300">{emotion}</span>
                <span className="text-white font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {memories.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">هنوز خاطره‌ای ثبت نشده</p>
        ) : (
          memories.map(memory => (
            <div
              key={memory.id}
              className="bg-gray-800/50 rounded p-2 text-sm border border-gray-700/30"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-gray-400 text-xs">
                  {TYPE_ICON[memory.type] ?? '❓'} {memory.type}
                </span>
                <span className="text-gray-500 text-xs">
                  {new Date(memory.timestamp).toLocaleTimeString('fa-IR')}
                </span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">{memory.content}</p>
              <div className="flex gap-3 mt-1">
                <span className="text-xs text-purple-400">
                  {EMOTION_ICON[memory.emotion] ?? ''} {memory.emotion}
                </span>
                <span className="text-xs text-yellow-500">⭐ {memory.importance}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
