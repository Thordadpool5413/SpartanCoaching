import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./index.css";

const _err = window.onerror;
window.onerror = (msg, ...args) => {
  if (typeof msg === "string" && msg.includes("ResizeObserver loop")) return true;
  return _err ? _err(msg, ...args) : false;
};

window.addEventListener("error", (e) => {
  if (e.message?.includes("ResizeObserver loop")) e.stopImmediatePropagation();
}, true);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
