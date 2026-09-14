import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import NationalDashboard from "./NationalDashboard";
import platformCss from "./platform.css?raw";
import enhancementCss from "./platform-enhancements.css?raw";

export default function TrustedMedicarePlatform() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const root = hostRef.current.shadowRoot || hostRef.current.attachShadow({ mode: "open" });
    if (!root.querySelector("style[data-medicare-platform]")) {
      const style = document.createElement("style");
      style.dataset.medicarePlatform = "true";
      style.textContent = platformCss
        .replace(":root", ":host")
        .replace("body{margin:0;min-width:320px;min-height:100vh;", ":host{display:block;min-width:0;min-height:100vh;") + enhancementCss;
      root.appendChild(style);
    }
    setMount(root);
  }, []);

  return <div ref={hostRef} data-testid="trusted-medicare-platform" className="min-h-screen w-full">{mount ? createPortal(<NationalDashboard />, mount) : null}</div>;
}
