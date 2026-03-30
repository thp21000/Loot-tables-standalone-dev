import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import SharedGainPage from "./components/SharedGainPage";
import { I18nProvider } from "./i18n";

function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  const isGainModalView = params.get("view") === "gain-modal";
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Root element introuvable.");
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <I18nProvider>
        {isGainModalView ? <SharedGainPage /> : <App />}
      </I18nProvider>
    </React.StrictMode>
  );
}

bootstrap();