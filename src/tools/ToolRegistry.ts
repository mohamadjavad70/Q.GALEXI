import type { IObservability } from "@/contracts/MonitoringContracts";
import type { ILogger } from "@/contracts/ServiceContracts";
import type { IPermissionLayer, PermissionAction } from "@/contracts/SecurityContracts";
import {
  type IToolRegistry,
  type RegisteredTool,
  type ToolExecutionContext,
} from "@/contracts/ToolContracts";
import { ContractViolationError } from "@/errors";
import { permissionLayer as defaultPermissionLayer } from "@/security/PermissionLayer";
import { logger as defaultLogger } from "@/services/Logger";

export class ToolRegistry implements IToolRegistry {
  private tools = new Map<string, RegisteredTool>();

  constructor(
    private readonly permission: IPermissionLayer = defaultPermissionLayer,
    private readonly logger: ILogger = defaultLogger,
    private readonly observability?: IObservability
  ) {}

  register(tool: RegisteredTool): void {
    this.tools.set(tool.id, tool);
  }

  list(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  async run(toolId: string, input: string, context?: ToolExecutionContext): Promise<string> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new ContractViolationError(`Tool not found: ${toolId}`, { toolId });
    }

    const action: PermissionAction = tool.permissionAction ?? "network.external";
    if (context?.actorId) {
      const decision = this.permission.checkPermission(action, {
        actorId: context.actorId,
        trustedSession: context.trustedSession,
        requiresApproval: context.requiresApproval,
      });
      if (!decision.allowed) {
        throw new ContractViolationError(decision.reason || "Tool execution denied", {
          toolId,
          action,
        });
      }
    }

    this.logger.info("tool.run", { toolId });
    this.observability?.metrics.increment("tool.run", 1, { toolId });
    return tool.run(input);
  }
}

export const toolRegistry = new ToolRegistry();
