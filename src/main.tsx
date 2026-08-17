import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./routes/AppRouter";
import AuthBootstrap from "./modules/auth/presentation/components/AuthBootstrap";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthBootstrap />
    <AppRouter />
  </React.StrictMode>
);
