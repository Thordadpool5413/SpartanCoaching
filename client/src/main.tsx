import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .catch(error => {
        console.error('SW registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
