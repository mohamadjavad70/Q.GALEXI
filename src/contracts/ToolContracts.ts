import type { PermissionAction } from "@/contracts/SecurityContracts";

export interface ToolExecutionContext {
  actorId: string;
  trustedSession?: boolean;
  requiresApproval?: boolean;
}

export interface RegisteredTool {
  id: string;
  description: string;
  permissionAction?: PermissionAction;
  run: (input: string) => Promise<string>;
}

export interface IToolRegistry {
  register(tool: RegisteredTool): void;
  list(): RegisteredTool[];
  run(toolId: string, input: string, context?: ToolExecutionContext): Promise<string>;
}
