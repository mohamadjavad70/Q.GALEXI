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
  baseUrl: import.meta.env.VITE_QMETARAM_API_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds
};

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  reasoning?: {
    internalQuestions: Array<{ question: string; answer: string }>;
    strategicQuestions: string[];
    actionableAnswers: string[];
  };
  error?: string;
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
  async sendChatMessage(message: string, history?: ChatMessage[]): Promise<ChatResponse> {
    try {
      this.abortController = new AbortController();
      const timeoutId = setTimeout(() => this.abortController?.abort(), this.config.timeout);

      const response = await fetch(`${this.config.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: history || [],
        }),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      // For streaming responses
      if (response.headers.get('content-type')?.includes('text/plain')) {
        const text = await response.text();
        return { message: text };
      }

      // For JSON responses
      const data = await response.json();
      return data;
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
   * Send a chat message with streaming response
   */
  async *streamChatMessage(message: string, history?: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    try {
      this.abortController = new AbortController();
      const timeoutId = setTimeout(() => this.abortController?.abort(), this.config.timeout);

      const response = await fetch(`${this.config.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: history || [],
        }),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        yield text;
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Stream error:', error);
      }
    } finally {
      this.abortController = null;
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
