import { z } from "zod";
import type { AppConfig } from "@/contracts/RuntimeContracts";
import { ConfigValidationError } from "@/errors";

const schema = z.object({
  VITE_RUNTIME_ENV: z.enum(["development", "test", "production"]).default("development"),
  VITE_QMETARAM_API_URL: z.string().url().default("http://localhost:8765"),
  VITE_API_URL: z.string().url().default("http://localhost:3001"),
  VITE_MEMORY_MAX_RECORDS: z.coerce.number().int().min(50).max(5000).default(500),
  VITE_REQUIRE_APPROVAL_FOR_EXTERNAL: z.string().optional().default("true"),
  VITE_ENABLE_TRACING: z.string().optional().default("true"),
});

function toBoolean(value: string): boolean {
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function envSource(): Record<string, unknown> {
  try {
    return import.meta.env as unknown as Record<string, unknown>;
  } catch {
    return process.env as unknown as Record<string, unknown>;
  }
}

export function loadAppConfig(raw?: Record<string, unknown>): AppConfig {
  const src = raw ?? envSource();
  const parsed = schema.safeParse(src);
  if (!parsed.success) {
    throw new ConfigValidationError("Invalid runtime configuration", {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }

  return {
    runtimeEnv: parsed.data.VITE_RUNTIME_ENV,
    qmetaramApiUrl: parsed.data.VITE_QMETARAM_API_URL,
    appApiUrl: parsed.data.VITE_API_URL,
    memoryMaxRecords: parsed.data.VITE_MEMORY_MAX_RECORDS,
    requireApprovalForExternal: toBoolean(parsed.data.VITE_REQUIRE_APPROVAL_FOR_EXTERNAL),
    enableTracing: toBoolean(parsed.data.VITE_ENABLE_TRACING),
  };
}
