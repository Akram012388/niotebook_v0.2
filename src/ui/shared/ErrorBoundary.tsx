"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "16px",
            fontFamily: "var(--font-body, system-ui)",
            color: "var(--foreground, #1c1917)",
            background: "var(--background, #f4f3ee)",
          }}
        >
          <h1 style={{ fontSize: "24px", fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "14px", opacity: 0.6 }}>
            An unexpected error occurred. Please reload the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "1px solid var(--border, #d6d3d1)",
              background: "var(--surface, #faf9f7)",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
