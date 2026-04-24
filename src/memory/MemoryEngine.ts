import type { IMemoryEngine, MemoryRecord, MemoryScope, MemorySummary } from "@/contracts/MemoryContracts";
import type { IObservability } from "@/contracts/MonitoringContracts";
import type { ILogger } from "@/contracts/ServiceContracts";
import { logger as defaultLogger } from "@/services/Logger";

const SHORT_KEY = "qgalexi_memory_short";
const LONG_KEY = "qgalexi_memory_long";

function storageKey(scope: MemoryScope): string {
  return scope === "short" ? SHORT_KEY : LONG_KEY;
}

export interface MemoryEngineOptions {
  maxRecords?: number;
  logger?: ILogger;
  observability?: IObservability;
}

export class MemoryEngine implements IMemoryEngine {
  private readonly maxRecords: number;
  private readonly logger: ILogger;
  private readonly observability?: IObservability;

  constructor(options: MemoryEngineOptions = {}) {
    this.maxRecords = options.maxRecords ?? 500;
    this.logger = options.logger ?? defaultLogger;
    this.observability = options.observability;
  }

  private read(scope: MemoryScope): MemoryRecord[] {
    try {
      const raw = localStorage.getItem(storageKey(scope));
      if (!raw) return [];
      const parsed = JSON.parse(raw) as MemoryRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private write(scope: MemoryScope, records: MemoryRecord[]): void {
    localStorage.setItem(storageKey(scope), JSON.stringify(records));
  }

  add(scope: MemoryScope, context: string, content: string): MemoryRecord {
    const records = this.read(scope);
    const rec: MemoryRecord = {
      id: `${scope}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      scope,
      context,
      content,
      timestamp: new Date().toISOString(),
    };
    records.push(rec);
    this.write(scope, records.slice(-this.maxRecords));
    this.logger.logSecurityEvent("memory_write", { scope, context, recordId: rec.id });
    this.observability?.metrics.increment("memory.write", 1, { scope });
    return rec;
  }

  retrieveByContext(context: string, scope: MemoryScope = "short"): MemoryRecord[] {
    const records = this.read(scope).filter((item) => item.context === context);
    this.logger.logSecurityEvent("memory_read", { scope, context, count: records.length });
    this.observability?.metrics.increment("memory.read", 1, { scope });
    return records;
  }

  summarize(context: string, scope: MemoryScope = "short"): MemorySummary {
    const entries = this.retrieveByContext(context, scope);
    const latest = entries.at(-1);
    const digest = entries
      .slice(-5)
      .map((entry) => entry.content)
      .join(" | ");

    return {
      context,
      entries: entries.length,
      latestTimestamp: latest?.timestamp,
      digest,
    };
  }
}

export const memoryEngine = new MemoryEngine();
