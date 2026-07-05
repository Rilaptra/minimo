import { createElement } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";

const rootElement = document.getElementById("root");

if (rootElement?.hasChildNodes()) {
  // Saat halaman pertama kali dimuat (SSR)
  hydrateRoot(rootElement, createElement(App, { url: window.location.href }));
} else if (rootElement) {
  // Fallback client side
  createRoot(rootElement).render(
    createElement(App, { url: window.location.href }),
  );
} else {
  console.error("Root element not found");
}
