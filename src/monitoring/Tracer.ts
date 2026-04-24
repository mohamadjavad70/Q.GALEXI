import type { ITracer, Span } from "@/contracts/MonitoringContracts";
import type { ILogger } from "@/contracts/ServiceContracts";

export class Tracer implements ITracer {
  constructor(private readonly logger: ILogger, private readonly enabled = true) {}

  startSpan(name: string, context?: Record<string, unknown>): Span {
    const id = `span-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startedAt = Date.now();
    if (this.enabled) {
      this.logger.debug("trace.span.start", { id, name, ...context });
    }

    return {
      id,
      name,
      startedAt,
      end: (status = "ok", endContext?: Record<string, unknown>) => {
        if (!this.enabled) return;
        this.logger.debug("trace.span.end", {
          id,
          name,
          status,
          durationMs: Date.now() - startedAt,
          ...endContext,
        });
      },
    };
  }
}
