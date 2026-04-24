import { logger } from "@/services/Logger";
import { ExternalServiceError } from "@/errors";

export interface QMetaRamConfig {
  baseUrl: string;
  timeout: number;
}

export interface ChatResponse {
  message: string;
  sessionId?: string;
  memoryId?: string;
  error?: string;
}

export interface MemoryItem {
  key: string;
  value: string;
  category?: string;
}

export interface MemoryListItem extends MemoryItem {
  created_at?: string;
}

const DEFAULT_CONFIG: QMetaRamConfig = {
  baseUrl: import.meta.env.VITE_QMETARAM_API_URL || "http://localhost:8765",
  timeout: 5000,
};

export class QmetaramApiService {
  private config: QMetaRamConfig;

  constructor(config?: Partial<QMetaRamConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  updateConfig(config: Partial<QMetaRamConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async sendChatMessage(message: string, userId = "guest", sessionId?: string): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    try {
      const body: Record<string, string> = { user_id: userId, message };
      if (sessionId) body.session_id = sessionId;

      const response = await fetch(`${this.config.baseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ExternalServiceError("Chat API request failed", {
          status: response.status,
          statusText: response.statusText,
        });
      }

      const data = await response.json();
      return {
        message: data.response ?? "",
        sessionId: data.session_id,
        memoryId: data.memory_id,
      };
    } catch (error) {
      logger.warn("Chat request failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
      if (error instanceof Error && error.name === "AbortError") {
        return { message: "", error: "Request timeout" };
      }
      return { message: "", error: error instanceof Error ? error.message : "Unknown error occurred" };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async sendToQMemory(
    key: string,
    value: string,
    category = "general",
    type: "short" | "long" = "short"
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/memory/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, category }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Memory store failed: ${response.status}`);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async getMemory(type: "short" | "long" | "analytical" = "short"): Promise<MemoryListItem[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/memory/${type}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async healthCheck(): Promise<{ status: "ok" | "error"; message?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok ? { status: "ok" } : { status: "error", message: `Status ${response.status}` };
    } catch (error) {
      return { status: "error", message: error instanceof Error ? error.message : "Connection failed" };
    }
  }
}

export const qmetaramApiService = new QmetaramApiService();
