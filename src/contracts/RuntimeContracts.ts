import type { IAgentCore } from "@/contracts/AgentContracts";
import type { IMemoryEngine } from "@/contracts/MemoryContracts";
import type { IPermissionLayer } from "@/contracts/SecurityContracts";
import type { IToolRegistry } from "@/contracts/ToolContracts";
import type { ILogger } from "@/contracts/ServiceContracts";
import type { IObservability } from "@/contracts/MonitoringContracts";

export interface AppConfig {
  runtimeEnv: "development" | "test" | "production";
  qmetaramApiUrl: string;
  appApiUrl: string;
  memoryMaxRecords: number;
  requireApprovalForExternal: boolean;
  enableTracing: boolean;
}

export interface IRuntime {
  readonly config: AppConfig;
  readonly logger: ILogger;
  readonly observability: IObservability;
  readonly permission: IPermissionLayer;
  readonly memory: IMemoryEngine;
  readonly tools: IToolRegistry;
  readonly agentCore: IAgentCore;
  health(): { status: "ok"; runtimeEnv: AppConfig["runtimeEnv"]; startedAt: string };
}
