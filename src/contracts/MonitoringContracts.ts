export interface MetricPoint {
  name: string;
  value: number;
  labels?: Record<string, string>;
}

export interface Span {
  id: string;
  name: string;
  startedAt: number;
  end: (status?: "ok" | "error", context?: Record<string, unknown>) => void;
}

export interface IMetricsRegistry {
  increment(name: string, value?: number, labels?: Record<string, string>): void;
  observe(name: string, value: number, labels?: Record<string, string>): void;
  snapshot(): MetricPoint[];
}

export interface ITracer {
  startSpan(name: string, context?: Record<string, unknown>): Span;
}

export interface IObservability {
  metrics: IMetricsRegistry;
  tracer: ITracer;
}
