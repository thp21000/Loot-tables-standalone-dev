import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { I18nProvider } from "./i18n";

function bootstrap() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Root element introuvable.");
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </React.StrictMode>
  );
}

bootstrap();