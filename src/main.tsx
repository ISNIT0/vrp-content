import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { VRPProvider } from "./sdk";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VRPProvider>
      <App />
    </VRPProvider>
  </StrictMode>,
);
