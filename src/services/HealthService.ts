import { qmetaramApiService } from "@/services/QmetaramApiService";

export interface HealthSnapshot {
  frontend: "ok";
  backend: "ok" | "error";
  checkedAt: string;
  detail?: string;
}

export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const backend = await qmetaramApiService.healthCheck();
  return {
    frontend: "ok",
    backend: backend.status,
    checkedAt: new Date().toISOString(),
    detail: backend.message,
  };
}
