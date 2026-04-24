import type { IMemoryEngine, MemorySummary } from "@/contracts/MemoryContracts";
import type { IPermissionLayer } from "@/contracts/SecurityContracts";
import type { IToolRegistry } from "@/contracts/ToolContracts";
import type { ILogger } from "@/contracts/ServiceContracts";
import type { IObservability } from "@/contracts/MonitoringContracts";

export type ExecutiveIntent = "conversation" | "automation" | "analysis";

export interface ExecutiveTask {
  intent: ExecutiveIntent;
  prompt: string;
}

export interface IExecutiveAgent {
  execute(task: ExecutiveTask): Promise<string>;
}

export interface QAgentRequest {
  actorId: string;
  message: string;
  trustedSession?: boolean;
  requiresApproval?: boolean;
}

export interface QAgentResponse {
  intent: ExecutiveIntent;
  output: string;
  memoryDigest: string;
  traceId?: string;
}

export interface QAgentCoreDeps {
  memory: IMemoryEngine;
  permission: IPermissionLayer;
  tools: IToolRegistry;
  agent: IExecutiveAgent;
  logger: ILogger;
  observability?: IObservability;
}

export interface IAgentCore {
  classify(message: string): ExecutiveIntent;
  handle(request: QAgentRequest): Promise<QAgentResponse>;
}

export interface WorkflowResult {
  response: string;
  memory: MemorySummary;
}
