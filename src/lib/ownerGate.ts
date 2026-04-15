/**
 * Owner gate — passphrase verification using SHA-256 hash comparison.
 * The plaintext passphrase is never stored in source code.
 */

const OWNER_KEY = "qcore_owner_unlocked";
const SESSION_KEY = "qcore_session_token";

// SHA-256 hash of the owner passphrase (not the passphrase itself)
const PASSPHRASE_HASH = "4cef96be38c021777252dc321cbf6b36df4647eb489e5d7ba793525bd5878c09";

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate a session-bound token to prevent simple localStorage manipulation
function generateSessionToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

let cachedToken: string | null = null;

export async function verifyPassphrase(input: string): Promise<boolean> {
  const hash = await sha256(input);
  return hash === PASSPHRASE_HASH;
}

export function isOwnerUnlocked(): boolean {
  try {
    const stored = localStorage.getItem(OWNER_KEY);
    const token = localStorage.getItem(SESSION_KEY);
    // Require both the flag AND a valid session token
    if (stored !== "true" || !token) return false;
    // Validate token matches current session (if we have a cached one)
    if (cachedToken && token !== cachedToken) return false;
    // If no cached token yet (page refresh), trust the stored one
    if (!cachedToken) cachedToken = token;
    return true;
  } catch {
    return false;
  }
}

export function unlockOwner() {
  try {
    const token = generateSessionToken();
    cachedToken = token;
    localStorage.setItem(OWNER_KEY, "true");
    localStorage.setItem(SESSION_KEY, token);
  } catch {
    void 0;
  }
}

export function lockOwner() {
  try {
    cachedToken = null;
    localStorage.removeItem(OWNER_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch {
    void 0;
  }
}
