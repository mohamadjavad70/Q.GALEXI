import type { IObservability } from "@/contracts/MonitoringContracts";
import type { ILogger } from "@/contracts/ServiceContracts";
import {
  type IPermissionLayer,
  type PermissionAction,
  type PermissionContext,
  type PermissionDecision,
} from "@/contracts/SecurityContracts";
import { PermissionDeniedError } from "@/errors";
import { logger as defaultLogger } from "@/services/Logger";

const DEFAULT_POLICY: Record<PermissionAction, { requiresApproval: boolean }> = {
  "chat.send": { requiresApproval: false },
  "memory.write": { requiresApproval: false },
  "memory.read": { requiresApproval: false },
  "voice.listen": { requiresApproval: false },
  "network.external": { requiresApproval: true },
};

export class PermissionLayer implements IPermissionLayer {
  constructor(
    private readonly logger: ILogger = defaultLogger,
    private readonly observability?: IObservability,
    private readonly requireApprovalForExternal = true
  ) {}

  checkPermission(action: PermissionAction, context: PermissionContext): PermissionDecision {
    const rule = DEFAULT_POLICY[action];

    if (!context.actorId) {
      const decision = { allowed: false, reason: "Missing actor identity" };
      this.logDecision(action, context, decision);
      return decision;
    }

    if (rule.requiresApproval && this.requireApprovalForExternal && !context.requiresApproval) {
      const decision = {
        allowed: false,
        reason: `Action ${action} requires explicit approval`,
      };
      this.logDecision(action, context, decision);
      return decision;
    }

    if (action === "network.external" && !context.trustedSession) {
      const decision = {
        allowed: false,
        reason: "External network access requires trusted session",
      };
      this.logDecision(action, context, decision);
      return decision;
    }

    const decision = { allowed: true };
    this.logDecision(action, context, decision);
    return decision;
  }

  can(action: PermissionAction, context: PermissionContext): PermissionDecision {
    return this.checkPermission(action, context);
  }

  require(action: PermissionAction, context: PermissionContext): void {
    const decision = this.checkPermission(action, context);
    if (!decision.allowed) {
      throw new PermissionDeniedError(decision.reason || "Permission denied", {
        action,
        actorId: context.actorId,
      });
    }
  }

  private logDecision(action: PermissionAction, context: PermissionContext, decision: PermissionDecision): void {
    this.logger.logSecurityEvent("permission_check", {
      action,
      actorId: context.actorId,
      granted: decision.allowed,
      reason: decision.reason,
    });
    this.observability?.metrics.increment("permission.check", 1, {
      action,
      granted: decision.allowed ? "true" : "false",
    });
  }
}

export const permissionLayer = new PermissionLayer();
