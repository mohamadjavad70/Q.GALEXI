/**
 * Backend Bridge — Connection to Q.MetaRam FastAPI Server
 * ──────────────────────────────────────────────────────────
 * Provides API functions to communicate with the Python backend
 */

export interface QMetaRamConfig {
  baseUrl: string;
  timeout: number;
}

// Default configuration (can be overridden via environment variables)
const DEFAULT_CONFIG: QMetaRamConfig = {
  baseUrl: import.meta.env.VITE_QMETARAM_API_URL || 'http://lot:  timeout: 5000, // 5 seconds — fast fail so offline fallback kicks in
};

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
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

export interface NeuralNode {
  node_id: string;
  parent_ids?: string[];
  weight?: number;
  data?: Record<string, unknown>;
}

export interface ReasoningProtocolResponse {
  finalAnswer: string;
  internalQuestions: Array<{ question: string; answer: string }>;
  strategicQuestions: string[];
  actionableAnswers: string[];
  followUpQuestion: string;
  relevantApps: Array<{
    name: string;
    category: string;
    topFeatures: string[];
  }>;
}

/**
 * QMetaRam API Client
 */
class QMetaRamApiClient {
  private config: QMetaRamConfig;
  private abortController: AbortController | null = null;

  constructor(config?: Partial<QMetaRamConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<QMetaRamConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Send a chat message to the backend
   */
  async sendChatMessage(message: string, userId = 'guest', sessionId?: string): Promise<ChatResponse> {
    try {
      this.abortController = new AbortController();
      const timeoutId = setTimeout(() => this.abortController?.abort(), this.config.timeout);

      const body: Record<string, string> = { user_id: userId, message };
      if (sessionId) body.session_id = sessionId;

      const response = await fetch(`${this.config.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // API returns {response, session_id, memory_id}
      return {
        message: data.response ?? '',
        sessionId: data.session_id,
        memoryId: data.memory_id,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { message: '', error: 'Request timeout' };
        }
        return { message: '', error: error.message };
      }
      return { message: '', error: 'Unknown error occurred' };
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Store a memory item (short-term by default)
   */
  async sendToQMemory(key: string, value: string, category = 'general', type: 'short' | 'long' = 'short'): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/memory/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, category } satisfies MemoryItem),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Memory store failed: ${response.status}`);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get memory items
   */
  async getMemory(type: 'short' | 'long' | 'analytical' = 'short'): Promise<MemoryListItem[]> {
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

  /**
   * Get chat history for a user
   */
  async getChatHistory(userId: string): Promise<Array<{ role: string; content: string; timestamp?: string }>> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/chat/history?user_id=${encodeURIComponent(userId)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  /**
   * Create a neural node
   */
  async createNode(nodeId: string, data: Record<string, unknown> = {}, parentIds: string[] = []): Promise<{ ok: boolean }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/nodes/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: nodeId, parent_ids: parentIds, data } satisfies NeuralNode),
        signal: AbortSignal.timeout(5000),
      });
      return { ok: response.ok };
    } catch {
      return { ok: false };
    }
  }

  /**
   * Execute 7-step reasoning protocol
   */
  async executeReasoningProtocol(prompt: string): Promise<ReasoningProtocolResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/reasoning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Reasoning protocol failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Fallback to local simulation if backend unavailable
      console.warn('Backend unavailable, using local reasoning simulation');
      return this.localReasoningFallback(prompt);
    }
  }

  /**
   * Local fallback for reasoning when backend is unavailable
   */
  private localReasoningFallback(prompt: string): ReasoningProtocolResponse {
    const internalQuestions = [
      { question: 'ماهیت درخواست چیست؟', answer: `تحلیل "${prompt}"` },
      { question: 'چه ابزارهایی نیاز است؟', answer: 'بررسی ابزارهای موجود' },
      { question: 'راه‌حل بهینه چیست؟', answer: 'طراحی مرحله‌به‌مرحله' },
      { question: 'محدودیت‌ها چیست؟', answer: 'زمان و منابع' },
      { question: 'چطور تست کنیم؟', answer: 'آزمایش مرحله‌ای' },
      { question: 'ریسک‌ها چیست؟', answer: 'مدیریت خطا و بازیابی' },
      { question: 'نتیجه نهایی چیست؟', answer: 'پیاده‌سازی قابل اجرا' },
    ];

    const strategicQuestions = [
      'آیا این ویژگی با اهداف کلی پروژه همسو است؟',
      'چه منابع اضافی برای پیاده‌سازی کامل نیاز است؟',
    ];

    const actionableAnswers = [
      'بررسی دقیق نیازمندی‌ها و اولویت‌بندی',
      'طراحی معماری سیستم با توجه به مقیاس‌پذیری',
      'پیاده‌سازی تدریجی با تست مداوم',
      'مستندسازی کد و رابط‌های API',
      'بهینه‌سازی عملکرد و تجربه کاربری',
    ];

    return {
      finalAnswer: `درخواست "${prompt}" دریافت شد. برای پیاده‌سازی کامل، نیاز به هماهنگی بین فرانت‌اند و بک‌اند داریم.`,
      internalQuestions,
      strategicQuestions,
      actionableAnswers,
      followUpQuestion: 'آیا می‌خواهید جزئیات بیشتری درباره نحوه پیاده‌سازی بدانید؟',
      relevantApps: [],
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return { status: 'ok' };
      }
      return { status: 'error', message: `Status ${response.status}` };
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  /**
   * Cancel ongoing requests
   */
  cancel(): void {
    this.abortController?.abort();
    this.abortController = null;
  }
}

// Singleton instance
export const qmetaramApi = new QMetaRamApiClient();

// Export for testing or custom configurations
export { QMetaRamApiClient };
