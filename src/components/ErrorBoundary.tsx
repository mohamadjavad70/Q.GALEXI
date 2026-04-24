import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/services/Logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Ignore errors from browser extensions
    const stack = error?.stack || "";
    if (
      stack.includes("chrome-extension://") ||
      stack.includes("moz-extension://")
    ) {
      this.setState({ hasError: false, error: null });
      return;
    }
    logger.error("ErrorBoundary caught", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0f",
            color: "#e0e0e0",
            fontFamily: "system-ui, sans-serif",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "#fff" }}>
            خطایی رخ داده است
          </h1>
          <p style={{ marginBottom: "1.5rem", opacity: 0.7, maxWidth: "400px" }}>
            ممکن است اکستنشن‌های مرورگر (کیف پول‌ها) باعث این مشکل شده باشند.
            حالت Incognito را امتحان کنید.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              تلاش مجدد
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                background: "#6366f1",
                color: "#fff",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              بارگذاری مجدد
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
