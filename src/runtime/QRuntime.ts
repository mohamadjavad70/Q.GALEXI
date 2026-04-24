import type { IRuntime } from "@/contracts/RuntimeContracts";
import { loadAppConfig } from "@/config/AppConfig";
import { Logger } from "@/services/Logger";
import { PermissionLayer } from "@/security/PermissionLayer";
import { MemoryEngine } from "@/memory/MemoryEngine";
import { ToolRegistry } from "@/tools/ToolRegistry";
import { ExecutiveAgent } from "@/agents/ExecutiveAgent";
import { QAgentCore } from "@/core/QAgentCore";
import { Observability } from "@/monitoring/Observability";
import { RuntimeBootstrapError } from "@/errors";

export class QRuntime implements IRuntime {
  private static instance: QRuntime | null = null;
  private readonly startedAt = new Date().toISOString();

  readonly config;
  readonly logger;
  readonly observability;
  readonly permission;
  readonly memory;
  readonly tools;
  readonly agentCore;

  private constructor(rawEnv?: Record<string, unknown>) {
    this.config = loadAppConfig(rawEnv);
    this.logger = new Logger();
    this.observability = new Observability(this.logger, this.config.enableTracing);
    this.permission = new PermissionLayer(this.logger, this.observability, this.config.requireApprovalForExternal);
    this.memory = new MemoryEngine({
      logger: this.logger,
      observability: this.observability,
      maxRecords: this.config.memoryMaxRecords,
    });
    this.tools = new ToolRegistry(this.permission, this.logger, this.observability);
    const agent = new ExecutiveAgent();
    this.agentCore = new QAgentCore({
      agent,
      logger: this.logger,
      memory: this.memory,
      permission: this.permission,
      tools: this.tools,
      observability: this.observability,
    });
  }

  static boot(rawEnv?: Record<string, unknown>): QRuntime {
    if (QRuntime.instance) return QRuntime.instance;
    try {
      QRuntime.instance = new QRuntime(rawEnv);
      return QRuntime.instance;
    } catch (error) {
      throw new RuntimeBootstrapError("Failed to bootstrap runtime", undefined, error);
    }
  }

  static resetForTests(): void {
    QRuntime.instance = null;
  }

  health(): { status: "ok"; runtimeEnv: "development" | "test" | "production"; startedAt: string } {
    return {
      status: "ok",
      runtimeEnv: this.config.runtimeEnv,
      startedAt: this.startedAt,
    };
  }
}

export function getRuntime(): QRuntime {
  return QRuntime.boot();
}

export const qRuntime = QRuntime.boot();
