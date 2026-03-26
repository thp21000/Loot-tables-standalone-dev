import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import SharedGainPage from "./components/SharedGainPage";
import { configureOwlbearAction, waitForOwlbearReady } from "./owlbear";
import { I18nProvider } from "./i18n";

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  const isGainModalView = params.get("view") === "gain-modal";

  document.body.dataset.view = isGainModalView ? "gain-modal" : "main-popover";
  document.documentElement.dataset.view = document.body.dataset.view;

  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Root element introuvable.");
  }

  rootElement.dataset.view = document.body.dataset.view;

  if (isGainModalView) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <I18nProvider>
          <SharedGainPage />
        </I18nProvider>
      </React.StrictMode>
    );
    return;
  }

  try {
    await waitForOwlbearReady();
    await configureOwlbearAction();
  } catch (error) {
    console.error("Initialisation Owlbear impossible :", error);
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