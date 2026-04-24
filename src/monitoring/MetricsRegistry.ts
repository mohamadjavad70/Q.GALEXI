import type { IMetricsRegistry, MetricPoint } from "@/contracts/MonitoringContracts";

interface Bucket {
  name: string;
  value: number;
  labels?: Record<string, string>;
}

export class MetricsRegistry implements IMetricsRegistry {
  private counters = new Map<string, Bucket>();
  private observations = new Map<string, Bucket>();

  increment(name: string, value = 1, labels?: Record<string, string>): void {
    const existing = this.counters.get(name);
    this.counters.set(name, {
      name,
      value: (existing?.value ?? 0) + value,
      labels,
    });
  }

  observe(name: string, value: number, labels?: Record<string, string>): void {
    const existing = this.observations.get(name);
    this.observations.set(name, {
      name,
      value: existing ? (existing.value + value) / 2 : value,
      labels,
    });
  }

  snapshot(): MetricPoint[] {
    return [...this.counters.values(), ...this.observations.values()].map((item) => ({
      name: item.name,
      value: item.value,
      labels: item.labels,
    }));
  }
}
