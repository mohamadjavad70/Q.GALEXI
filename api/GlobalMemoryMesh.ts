// ─── Q Global Memory Mesh — Shared planetary brain ───────────────────────────
// حافظه جمعی مشترک بین تمام سیارات، agentها و کاربران
import { randomUUID } from 'crypto';

export interface MemoryNode {
  id: string;
  type: 'agent' | 'planet' | 'user' | 'event';
  content: string;
  emotion: string;
  timestamp: number;
  importance: number; // 0–100
  connections: string[];
  planetId?: string;
  agentId?: string;
  userId?: string;
}

export interface MemoryQuery {
  type?: MemoryNode['type'];
  planetId?: string;
  agentId?: string;
  userId?: string;
  emotion?: string;
  minImportance?: number;
  timeRange?: { start: number; end: number };
  limit?: number;
}

export class GlobalMemoryMesh {
  readonly memories = new Map<string, MemoryNode>();
  private indexByPlanet  = new Map<string, Set<string>>();
  private indexByAgent   = new Map<string, Set<string>>();
  private indexByUser    = new Map<string, Set<string>>();
  private indexByEmotion = new Map<string, Set<string>>();

  // ─── Add ──────────────────────────────────────────────────────────────────
  addMemory(memory: Omit<MemoryNode, 'id' | 'timestamp'>): string {
    const id = randomUUID();
    const node: MemoryNode = {
      ...memory,
      id,
      timestamp: Date.now(),
      connections: memory.connections ?? [],
    };
    this.memories.set(id, node);
    this._index(node);
    this._prune();
    return id;
  }

  private _index(node: MemoryNode): void {
    const add = (map: Map<string, Set<string>>, key: string | undefined) => {
      if (!key) return;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(node.id);
    };
    add(this.indexByPlanet,  node.planetId);
    add(this.indexByAgent,   node.agentId);
    add(this.indexByUser,    node.userId);
    add(this.indexByEmotion, node.emotion);
  }

  // ─── Query ────────────────────────────────────────────────────────────────
  query(q: MemoryQuery): MemoryNode[] {
    let results = Array.from(this.memories.values());

    if (q.type) results = results.filter(m => m.type === q.type);

    const filterByIndex = (idx: Map<string, Set<string>>, key?: string) => {
      if (!key) return;
      const ids = idx.get(key);
      if (ids) results = results.filter(m => ids.has(m.id));
      else results = [];
    };
    filterByIndex(this.indexByPlanet,  q.planetId);
    filterByIndex(this.indexByAgent,   q.agentId);
    filterByIndex(this.indexByUser,    q.userId);
    filterByIndex(this.indexByEmotion, q.emotion);

    if (q.minImportance !== undefined) {
      results = results.filter(m => m.importance >= q.minImportance!);
    }
    if (q.timeRange) {
      results = results.filter(
        m => m.timestamp >= q.timeRange!.start && m.timestamp <= q.timeRange!.end,
      );
    }

    const now = Date.now();
    results.sort((a, b) => {
      const score = (m: MemoryNode) =>
        m.importance * 0.7 - (now - m.timestamp) / 1_000_000 * 0.3;
      return score(b) - score(a);
    });

    return results.slice(0, q.limit ?? 50);
  }

  getCollectiveMemory(planetId: string, limit = 20): MemoryNode[] {
    return this.query({ planetId, limit });
  }

  getAgentMemory(agentId: string, limit = 20): MemoryNode[] {
    return this.query({ agentId, limit });
  }

  getEmotionalTrend(planetId: string, hours = 24): Record<string, number> {
    const cutoff = Date.now() - hours * 3_600_000;
    const nodes  = this.query({ planetId, timeRange: { start: cutoff, end: Date.now() } });
    const trend: Record<string, number> = {};
    for (const m of nodes) {
      if (m.emotion) trend[m.emotion] = (trend[m.emotion] ?? 0) + 1;
    }
    return trend;
  }

  // ─── Prune (7-day low-importance culling) ─────────────────────────────────
  private _prune(): void {
    const cutoff = Date.now() - 7 * 86_400_000;
    const toDelete: string[] = [];
    for (const [id, m] of this.memories) {
      if (m.timestamp < cutoff && m.importance < 30) toDelete.push(id);
    }
    for (const id of toDelete) this.memories.delete(id);
    if (toDelete.length > 0) {
      console.log(`[Memory] Pruned ${toDelete.length} low-importance memories`);
    }
  }

  // ─── Stats ────────────────────────────────────────────────────────────────
  getStats(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    for (const m of this.memories.values()) {
      byType[m.type] = (byType[m.type] ?? 0) + 1;
    }
    return { total: this.memories.size, byType };
  }

  // ─── Persistence helpers ──────────────────────────────────────────────────
  toJSON(): MemoryNode[] {
    return Array.from(this.memories.values());
  }

  fromJSON(nodes: MemoryNode[]): void {
    for (const node of nodes) {
      this.memories.set(node.id, node);
      this._index(node);
    }
    console.log(`[Memory] Loaded ${nodes.length} memories from persistence`);
  }
}

export const globalMemory = new GlobalMemoryMesh();
