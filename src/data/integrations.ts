/**
 * QMETARAM Integrations Registry
 * ─────────────────────────────────
 * Connector definitions with tri-state permission model.
 * Managed via Command Center → Integrations tab.
 */

import { safeGetJSON, safeSetJSON } from "@/lib/safeParse";

export type PermissionLevel = "revoked" | "read" | "readwrite" | "auto";

export interface Connector {
  id: string;
  nameEn: string;
  nameFa: string;
  icon: string;
  category: "social" | "ai" | "device" | "tool";
  permission: PermissionLevel;
  placeholder?: boolean; // requires native/server
}

export const defaultConnectors: Connector[] = [
  // Social (7+)
  { id: "instagram", nameEn: "Instagram", nameFa: "اینستاگرام", icon: "📷", category: "social", permission: "revoked" },
  { id: "youtube", nameEn: "YouTube", nameFa: "یوتیوب", icon: "▶️", category: "social", permission: "revoked" },
  { id: "x", nameEn: "X (Twitter)", nameFa: "ایکس", icon: "𝕏", category: "social", permission: "revoked" },
  { id: "tiktok", nameEn: "TikTok", nameFa: "تیک‌تاک", icon: "🎵", category: "social", permission: "revoked" },
  { id: "linkedin", nameEn: "LinkedIn", nameFa: "لینکدین", icon: "💼", category: "social", permission: "revoked" },
  { id: "telegram", nameEn: "Telegram", nameFa: "تلگرام", icon: "✈️", category: "social", permission: "revoked" },
  { id: "discord", nameEn: "Discord", nameFa: "دیسکورد", icon: "🎮", category: "social", permission: "revoked" },
  { id: "whatsapp", nameEn: "WhatsApp", nameFa: "واتساپ", icon: "💬", category: "social", permission: "revoked" },
  { id: "pinterest", nameEn: "Pinterest", nameFa: "پینترست", icon: "📌", category: "social", permission: "revoked" },

  // AI Providers
  { id: "openai", nameEn: "OpenAI (ChatGPT)", nameFa: "اوپن‌ای‌آی", icon: "🤖", category: "ai", permission: "revoked" },
  { id: "gemini", nameEn: "Gemini (Google)", nameFa: "جیمنی", icon: "✨", category: "ai", permission: "revoked" },
  { id: "claude", nameEn: "Claude (Anthropic)", nameFa: "کلود", icon: "🧠", category: "ai", permission: "revoked" },
  { id: "grok", nameEn: "Grok (xAI)", nameFa: "گروک", icon: "⚡", category: "ai", permission: "revoked" },
  { id: "deepseek", nameEn: "DeepSeek", nameFa: "دیپ‌سیک", icon: "🔬", category: "ai", permission: "revoked" },
  { id: "lovable", nameEn: "Lovable", nameFa: "لاوبل", icon: "💜", category: "ai", permission: "revoked" },
  { id: "custom-ai", nameEn: "Custom AI", nameFa: "هوش سفارشی", icon: "🔧", category: "ai", permission: "revoked" },

  // Prompt writers & coders
  { id: "prompt-writer", nameEn: "Prompt Writer", nameFa: "پرامپت‌نویس", icon: "✍️", category: "ai", permission: "revoked" },
  { id: "code-engine", nameEn: "Code Engine", nameFa: "موتور کد", icon: "💻", category: "ai", permission: "revoked" },
  { id: "gpu-engine", nameEn: "GPU Engine", nameFa: "موتور GPU", icon: "🎮", category: "ai", permission: "revoked", placeholder: true },

  // Devices
  { id: "microphone", nameEn: "Microphone", nameFa: "میکروفون", icon: "🎙️", category: "device", permission: "revoked" },
  { id: "camera", nameEn: "Camera", nameFa: "دوربین", icon: "📹", category: "device", permission: "revoked" },
  { id: "files", nameEn: "File Picker", nameFa: "فایل‌ها", icon: "📁", category: "device", permission: "revoked" },
  { id: "laptop", nameEn: "Laptop Access", nameFa: "لپ‌تاپ", icon: "💻", category: "device", permission: "revoked", placeholder: true },
  { id: "phone", nameEn: "Phone Access", nameFa: "تلفن", icon: "📱", category: "device", permission: "revoked", placeholder: true },

  // Tools / Browsers
  { id: "chrome", nameEn: "Google Chrome", nameFa: "گوگل کروم", icon: "🌐", category: "tool", permission: "revoked", placeholder: true },
  { id: "firefox", nameEn: "Firefox", nameFa: "فایرفاکس", icon: "🦊", category: "tool", permission: "revoked", placeholder: true },
  { id: "terminal", nameEn: "Terminal", nameFa: "ترمینال", icon: "🖥️", category: "tool", permission: "revoked", placeholder: true },
  { id: "browser-bridge", nameEn: "Browser Bridge", nameFa: "پل مرورگر", icon: "🌉", category: "tool", permission: "revoked", placeholder: true },
];

const STORAGE_KEY = "qmetaram-integrations";

export function getConnectors(): Connector[] {
  return safeGetJSON(STORAGE_KEY, defaultConnectors);
}

export function saveConnectors(connectors: Connector[]) {
  safeSetJSON(STORAGE_KEY, connectors);
}
