import type { IObservability } from "@/contracts/MonitoringContracts";
import type { ILogger } from "@/contracts/ServiceContracts";
import { MetricsRegistry } from "@/monitoring/MetricsRegistry";
import { Tracer } from "@/monitoring/Tracer";

export class Observability implements IObservability {
  public readonly metrics: MetricsRegistry;
  public readonly tracer: Tracer;

  constructor(logger: ILogger, enableTracing = true) {
    this.metrics = new MetricsRegistry();
    this.tracer = new Tracer(logger, enableTracing);
  }
}
