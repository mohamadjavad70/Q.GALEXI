import type { IMemoryEngine } from "@/contracts/MemoryContracts";
import type { ILogger } from "@/contracts/ServiceContracts";
import { memoryEngine } from "@/memory/MemoryEngine";
import { logger } from "@/services/Logger";

export interface WorkflowInput {
  userId: string;
  message: string;
}

export interface WorkflowOutput {
  response: string;
  memoryDigest: string;
}

export class ExecutiveAssistantWorkflow {
  constructor(
    private readonly memory: IMemoryEngine = memoryEngine,
    private readonly runtimeLogger: ILogger = logger
  ) {}

  run(input: WorkflowInput): WorkflowOutput {
    const context = `user:${input.userId}`;
    this.memory.add("short", context, input.message);
    const summary = this.memory.summarize(context, "short");

    this.runtimeLogger.info("Workflow executed", { userId: input.userId, entries: summary.entries });

    return {
      response: `Command accepted. Next action: ${input.message}`,
      memoryDigest: summary.digest,
    };
  }
}

export const executiveAssistantWorkflow = new ExecutiveAssistantWorkflow();
