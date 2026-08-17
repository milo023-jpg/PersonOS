import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import AppRouter from "./routes/AppRouter";
import AuthBootstrap from "./modules/auth/presentation/components/AuthBootstrap";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "./index.css";

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthBootstrap />
    <AppRouter />
  </React.StrictMode>
);
