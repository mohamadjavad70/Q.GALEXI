import { describe, expect, it } from "vitest";
import { qRuntime } from "@/runtime/QRuntime";

describe("Contracts integrity", () => {
  it("runtime exposes contract-compliant major modules", () => {
    expect(typeof qRuntime.agentCore.handle).toBe("function");
    expect(typeof qRuntime.memory.add).toBe("function");
    expect(typeof qRuntime.permission.checkPermission).toBe("function");
    expect(typeof qRuntime.tools.run).toBe("function");
    expect(typeof qRuntime.logger.logSecurityEvent).toBe("function");
  });
});
