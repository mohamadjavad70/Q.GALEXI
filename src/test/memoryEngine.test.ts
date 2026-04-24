import { beforeEach, describe, expect, it } from "vitest";
import { MemoryEngine } from "@/memory/MemoryEngine";

describe("MemoryEngine", () => {
  const engine = new MemoryEngine();

  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves records by context", () => {
    engine.add("short", "ctx:1", "hello");
    engine.add("short", "ctx:1", "world");
    engine.add("short", "ctx:2", "other");

    const records = engine.retrieveByContext("ctx:1");
    expect(records).toHaveLength(2);
  });

  it("builds summary digest", () => {
    engine.add("short", "ctx:sum", "first");
    engine.add("short", "ctx:sum", "second");
    const summary = engine.summarize("ctx:sum");

    expect(summary.entries).toBe(2);
    expect(summary.digest).toContain("first");
    expect(summary.digest).toContain("second");
  });
});
