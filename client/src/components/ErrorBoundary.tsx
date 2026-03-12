import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("App error caught by boundary:", error, info);
  }

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
            padding: "2rem",
            backgroundColor: "#0a0a0a",
            color: "#ffffff",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div style={{ maxWidth: "400px", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", color: "#ef4444" }}>
              SPARTAN COACHING
            </h1>
            <p style={{ marginBottom: "1.5rem", color: "#9ca3af", fontSize: "1rem" }}>
              Something went wrong. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: "#dc2626",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 2rem",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
