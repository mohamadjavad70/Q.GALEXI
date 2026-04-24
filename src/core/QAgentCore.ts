import type {
  IAgentCore,
  QAgentCoreDeps,
  QAgentRequest,
  QAgentResponse,
  ExecutiveIntent,
} from "@/contracts/AgentContracts";
import type { PermissionAction } from "@/contracts/SecurityContracts";
import { PermissionDeniedError } from "@/errors";

export class QAgentCore implements IAgentCore {
  constructor(private readonly deps: QAgentCoreDeps) {}

  classify(message: string): ExecutiveIntent {
    const lower = message.toLowerCase();
    if (/(automate|execute|run|workflow)/.test(lower)) return "automation";
    if (/(analyze|audit|strategy|report)/.test(lower)) return "analysis";
    return "conversation";
  }

  private permissionForIntent(intent: ExecutiveIntent): PermissionAction {
    if (intent === "automation") return "network.external";
    return "chat.send";
  }

  async handle(request: QAgentRequest): Promise<QAgentResponse> {
    const span = this.deps.observability?.tracer.startSpan("agent.handle", {
      actorId: request.actorId,
    });
    const intent = this.classify(request.message);
    const action = this.permissionForIntent(intent);

    const decision = this.deps.permission.checkPermission(action, {
      actorId: request.actorId,
      trustedSession: request.trustedSession,
      requiresApproval: request.requiresApproval,
    });

    if (!decision.allowed) {
      this.deps.logger.warn("Permission denied", {
        actorId: request.actorId,
        action,
        reason: decision.reason,
      });
      this.deps.observability?.metrics.increment("agent.permission.denied", 1, { action, intent });
      span?.end("error", { reason: decision.reason });
      throw new PermissionDeniedError(decision.reason || "Permission denied", {
        actorId: request.actorId,
        action,
      });
    }

    const output = await this.deps.agent.execute({ intent, prompt: request.message });
    const ctx = `user:${request.actorId}`;
    this.deps.memory.add("short", ctx, request.message);
    this.deps.memory.add("short", ctx, output);
    const summary = this.deps.memory.summarize(ctx);

    this.deps.logger.info("QAgentCore request handled", { actorId: request.actorId, intent });
    this.deps.observability?.metrics.increment("agent.request.success", 1, { intent });
    span?.end("ok", { intent });

    return {
      intent,
      output,
      memoryDigest: summary.digest,
      traceId: span?.id,
    };
  }
}
