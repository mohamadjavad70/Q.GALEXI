export type MemoryScope = "short" | "long";

export interface MemoryRecord {
  id: string;
  scope: MemoryScope;
  context: string;
  content: string;
  timestamp: string;
}

export interface MemorySummary {
  context: string;
  entries: number;
  latestTimestamp?: string;
  digest: string;
}

export interface IMemoryEngine {
  add(scope: MemoryScope, context: string, content: string): MemoryRecord;
  retrieveByContext(context: string, scope?: MemoryScope): MemoryRecord[];
  summarize(context: string, scope?: MemoryScope): MemorySummary;
}
