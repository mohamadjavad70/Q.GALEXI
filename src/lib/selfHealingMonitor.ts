/**
 * Self-Healing Console Monitor
 * ────────────────────────────────────────
 * Monitors console errors and provides AI-assisted debugging
 */

export interface ConsoleError {
  message: string;
  stack?: string;
  timestamp: number;
  severity: 'error' | 'warning' | 'info';
  source?: string;
  resolved?: boolean;
}

interface HealingSuggestion {
  error: ConsoleError;
  diagnosis: string;
  suggestions: string[];
  autoFix?: () => void;
}

class SelfHealingMonitor {
  private errors: ConsoleError[] = [];
  private listeners: ((error: ConsoleError) => void)[] = [];
  private originalConsole: {
    error: typeof console.error;
    warn: typeof console.warn;
    log: typeof console.log;
  };
  private isMonitoring = false;
  private maxErrors = 50;

  constructor() {
    this.originalConsole = {
      error: console.error,
      warn: console.warn,
      log: console.log,
    };
  }

  /**
   * Start monitoring console
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Override console.error
    console.error = (...args: unknown[]) => {
      this.originalConsole.error.apply(console, args);
      this.captureError('error', args);
    };

    // Override console.warn
    console.warn = (...args: unknown[]) => {
      this.originalConsole.warn.apply(console, args);
      this.captureError('warning', args);
    };

    // Global error handler
    window.addEventListener('error', (event) => {
      // Skip extension errors
      if (event.filename?.includes('extension://')) return;
      this.captureError('error', [event.message], event.error?.stack, event.filename);
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const stack = String(event.reason?.stack || '');
      const msg = String(event.reason?.message || event.reason || '');
      // Skip browser extension errors
      if (
        stack.includes('chrome-extension://') ||
        stack.includes('moz-extension://') ||
        msg.includes('func sseError not found')
      ) return;
      this.captureError('error', [event.reason], undefined, 'Promise');
    });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.log = this.originalConsole.log;
    this.isMonitoring = false;
  }

  /**
   * Capture error
   */
  private captureError(
    severity: 'error' | 'warning' | 'info',
    args: unknown[],
    stack?: string,
    source?: string
  ) {
    const message = args.map((arg: unknown) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }).join(' ');

    const error: ConsoleError = {
      message,
      stack,
      timestamp: Date.now(),
      severity,
      source,
      resolved: false,
    };

    this.errors.push(error);

    // Maintain max size
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(error));
  }

  /**
   * Get all errors
   */
  getErrors(): ConsoleError[] {
    return [...this.errors];
  }

  /**
   * Get unresolved errors
   */
  getUnresolvedErrors(): ConsoleError[] {
    return this.errors.filter(e => !e.resolved);
  }

  /**
   * Mark error as resolved
   */
  resolveError(timestamp: number) {
    const error = this.errors.find(e => e.timestamp === timestamp);
    if (error) {
      error.resolved = true;
    }
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Subscribe to new errors
   */
  subscribe(listener: (error: ConsoleError) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Analyze error and provide suggestions
   */
  analyzeError(error: ConsoleError): HealingSuggestion {
    const msg = error.message.toLowerCase();
    
    // Common React/Vite errors
    if (msg.includes('cannot find module') || msg.includes('module not found')) {
      return {
        error,
        diagnosis: 'Missing module or incorrect import path',
        suggestions: [
          'Check if the module is installed: npm install <module-name>',
          'Verify the import path is correct',
          'Check if there are typos in the import statement',
          'Ensure the module is listed in package.json',
        ],
      };
    }

    if (msg.includes('unexpected token') || msg.includes('syntax error')) {
      return {
        error,
        diagnosis: 'JavaScript/TypeScript syntax error',
        suggestions: [
          'Check for missing brackets, parentheses, or semicolons',
          'Verify all strings are properly closed',
          'Look for trailing commas in objects',
          'Check if JSX is properly formatted',
        ],
      };
    }

    if (msg.includes('cannot read property') || msg.includes('undefined')) {
      return {
        error,
        diagnosis: 'Accessing property on undefined/null value',
        suggestions: [
          'Add optional chaining: object?.property',
          'Check if the object exists before accessing: if (object) { ... }',
          'Use nullish coalescing: object ?? defaultValue',
          'Initialize variables with default values',
        ],
      };
    }

    if (msg.includes('maximum update depth') || msg.includes('too many re-renders')) {
      return {
        error,
        diagnosis: 'Infinite render loop detected',
        suggestions: [
          'Check useEffect dependencies array',
          'Avoid setting state in render function',
          'Memoize callbacks with useCallback',
          'Use useMemo for expensive calculations',
        ],
      };
    }

    if (msg.includes('hydration') || msg.includes('mismatch')) {
      return {
        error,
        diagnosis: 'Server/client rendering mismatch',
        suggestions: [
          'Ensure server and client render the same content',
          'Use useEffect for client-only code',
          'Check for random values or dates in render',
          'Validate localStorage/sessionStorage usage',
        ],
      };
    }

    if (msg.includes('network') || msg.includes('fetch failed')) {
      return {
        error,
        diagnosis: 'Network request failed',
        suggestions: [
          'Check if the API endpoint is correct',
          'Verify CORS settings on the server',
          'Check network connectivity',
          'Add error handling to fetch calls',
        ],
      };
    }

    if (msg.includes('cors')) {
      return {
        error,
        diagnosis: 'Cross-Origin Resource Sharing (CORS) error',
        suggestions: [
          'Configure CORS headers on the backend',
          'Use a proxy in development (vite.config.ts)',
          'Check if credentials are being sent correctly',
          'Verify the API allows your origin',
        ],
      };
    }

    // Generic suggestions
    return {
      error,
      diagnosis: 'General error detected',
      suggestions: [
        'Check the browser console for more details',
        'Review the stack trace if available',
        'Search for the error message online',
        'Check recent code changes',
      ],
    };
  }

  /**
   * Get error statistics
   */
  getStatistics() {
    const total = this.errors.length;
    const byType = {
      error: this.errors.filter(e => e.severity === 'error').length,
      warning: this.errors.filter(e => e.severity === 'warning').length,
      info: this.errors.filter(e => e.severity === 'info').length,
    };
    const resolved = this.errors.filter(e => e.resolved).length;
    const unresolved = total - resolved;

    return {
      total,
      byType,
      resolved,
      unresolved,
    };
  }
}

// Singleton instance
export const selfHealingMonitor = new SelfHealingMonitor();

// Auto-start in development
if (import.meta.env.DEV) {
  selfHealingMonitor.startMonitoring();
}

export type { ConsoleError, HealingSuggestion };
