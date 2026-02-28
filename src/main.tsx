import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { VRPProvider } from "./vrp-sdk";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VRPProvider>
      <App />
    </VRPProvider>
  </StrictMode>,
);
