import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // Production: register service worker for PWA
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .catch(error => {
          console.error('SW registration failed:', error);
        });
    });
  } else {
    // Development: unregister any existing service workers so Vite HMR works cleanly
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
