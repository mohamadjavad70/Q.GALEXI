import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initI18n } from "./lib/i18n";

// 🛡️ IMMEDIATE extension error suppression — must run BEFORE React renders
// Prevents Binance Wallet / MetaMask from causing blank screens
const suppressExtensionErrors = (event: PromiseRejectionEvent) => {
  const msg = String(event.reason?.message || event.reason || "");
  const stack = String(event.reason?.stack || "");
  if (
    msg.includes("func sseError not found") ||
    msg.includes("Origin not allowed") ||
    msg.includes("MetaMask") ||
    msg.includes("ethereum") ||
    msg.includes("Cannot redefine property") ||
    stack.includes("chrome-extension://") ||
    stack.includes("moz-extension://")
  ) {
    event.preventDefault();
  }
};
window.addEventListener("unhandledrejection", suppressExtensionErrors);

const suppressExtensionSyncErrors = (event: ErrorEvent) => {
  const src = event.filename || "";
  const msg = event.message || "";
  if (
    src.includes("chrome-extension://") ||
    src.includes("moz-extension://") ||
    msg.includes("ethereum") ||
    msg.includes("Cannot redefine property") ||
    msg.includes("func sseError not found")
  ) {
    event.preventDefault();
  }
};
window.addEventListener("error", suppressExtensionSyncErrors);

// 🛡️ Pre-boot URL sanitization
const sanitizeURL = () => {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("token");
  if (token) {
    sessionStorage.setItem("q_vault_gate", token);
    url.searchParams.delete("token");
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
  }
};
sanitizeURL();

initI18n();

createRoot(document.getElementById("root")!).render(<App />);
