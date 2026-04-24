import { describe, expect, it } from "vitest";
import { QAgentCore } from "@/core/QAgentCore";
import { executiveAgent } from "@/agents/ExecutiveAgent";
import { MemoryEngine } from "@/memory/MemoryEngine";
import { PermissionLayer } from "@/security/PermissionLayer";
import { toolRegistry } from "@/tools/ToolRegistry";
import { logger } from "@/services/Logger";
import { PermissionDeniedError } from "@/errors";
import { qRuntime } from "@/runtime/QRuntime";

describe("QAgentCore", () => {
  it("classifies automation messages", () => {
    expect(qRuntime.agentCore.classify("please automate invoice workflow")).toBe("automation");
  });

  it("handles safe conversational request", async () => {
    const result = await qRuntime.agentCore.handle({
      actorId: "test-user",
      message: "summarize my day",
      trustedSession: true,
      requiresApproval: true,
    });

    expect(result.output.length).toBeGreaterThan(0);
    expect(result.memoryDigest).toContain("summarize my day");
  });

  it("throws typed permission error on unapproved external action", async () => {
    const isolated = new QAgentCore({
      agent: executiveAgent,
      logger,
      memory: new MemoryEngine(),
      permission: new PermissionLayer(logger, undefined, true),
      tools: toolRegistry,
    });

    await expect(
      isolated.handle({
        actorId: "test-user",
        message: "run workflow for payments",
        trustedSession: true,
        requiresApproval: false,
      })
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
