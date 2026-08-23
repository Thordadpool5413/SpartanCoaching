import { createRoot } from "react-dom/client";
import { Component, type ErrorInfo, type ReactNode } from "react";
import App from "./App";
import { ThemeProvider } from "@/context/ThemeContext";
import "./index.css";

class RootErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application render failed", error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="min-h-screen surface-page flex items-center justify-center px-6 py-16 text-center">
          <div className="max-w-md space-y-5">
            <p className="text-kicker">Spartan Coaching</p>
            <h1 className="text-3xl font-display font-black text-foreground">We could not load this page.</h1>
            <p className="text-muted-foreground leading-relaxed">
              Your account and subscription are unchanged. Refresh the page or return to the homepage.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button className="font-bold text-primary hover:underline" type="button" onClick={() => window.location.reload()}>
                Refresh page
              </button>
              <a className="font-bold text-primary hover:underline" href="/">
                Go to homepage
              </a>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

const _err = window.onerror;
window.onerror = (msg, ...args) => {
  if (typeof msg === "string" && msg.includes("ResizeObserver loop")) return true;
  return _err ? _err(msg, ...args) : false;
};

window.addEventListener("error", (e) => {
  if (e.message?.includes("ResizeObserver loop")) e.stopImmediatePropagation();
}, true);

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </RootErrorBoundary>,
);
