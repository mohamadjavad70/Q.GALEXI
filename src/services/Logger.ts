import type { ILogger, LogEvent } from "@/contracts/ServiceContracts";

export class Logger implements ILogger {
  private sink(event: LogEvent): void {
    const payload = { ...event, app: "Q.GALEXI" };
    if (event.level === "error") {
      console.error(payload);
      return;
    }
    if (event.level === "warn") {
      console.warn(payload);
      return;
    }
    if (event.level === "debug") {
      console.debug(payload);
      return;
    }
    console.info(payload);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.sink({ level: "debug", message, context, timestamp: new Date().toISOString() });
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.sink({ level: "info", message, context, timestamp: new Date().toISOString() });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.sink({ level: "warn", message, context, timestamp: new Date().toISOString() });
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.sink({ level: "error", message, context, timestamp: new Date().toISOString() });
  }

  logSecurityEvent(event: string, context?: Record<string, unknown>): void {
    this.sink({
      level: "warn",
      message: `security.${event}`,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

export const logger = new Logger();
