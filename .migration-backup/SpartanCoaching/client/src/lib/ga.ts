declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (!gaId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", gaId, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
}

export function pageView(path: string) {
  init();
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (typeof window === "undefined" || !window.gtag || !gaId) return;
  window.gtag("event", "page_view", {
    page_path: path,
    send_to: gaId,
  });
}

export function gaEvent(action: string, category: string, label?: string) {
  init();
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", action, {
    event_category: category,
    ...(label ? { event_label: label } : {}),
  });
}
