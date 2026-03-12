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

const loader = document.getElementById("spartan-loader");
if (loader) {
  loader.style.opacity = "0";
  setTimeout(() => loader.remove(), 350);
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
