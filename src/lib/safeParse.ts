/**
 * Safe localStorage helpers — schema validation + fallback to defaults.
 * Prevents malformed data from crashing the app.
 */

export function safeGetJSON<T>(key: string, fallback: T, validate?: (v: unknown) => v is T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (validate && !validate(parsed)) {
      console.warn(`[safeParse] invalid data for "${key}", resetting to default`);
      localStorage.removeItem(key);
      return fallback;
    }
    return parsed as T;
  } catch {
    console.warn(`[safeParse] corrupt data for "${key}", resetting`);
    localStorage.removeItem(key);
    return fallback;
  }
}

export function safeSetJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[safeParse] failed to write "${key}"`, e);
  }
}
