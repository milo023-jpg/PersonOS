import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./routes/AppRouter";
import AuthBootstrap from "./modules/auth/presentation/components/AuthBootstrap";
import { platformService } from "./services/platform/PlatformService";
import { notificationService } from "./services/notifications/NotificationService";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "./index.css";

// El Service Worker solo se registra en web/PWA. Dentro de Capacitor (Android)
// no debe registrarse para evitar cachés duplicadas y conflictos con las
// notificaciones nativas. La detección usa PlatformService (fuente única).
if (import.meta.env.PROD && !platformService.isNative() && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        void navigator.serviceWorker
            .register(`${import.meta.env.BASE_URL}sw.js`)
            .catch((error) => console.error("Service Worker registration failed:", error));
    });
}

// Inicialización de notificaciones (canales, permisos y listener de tap).
// En web no hace nada: la implementación web no define init().
void notificationService.init?.();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AuthBootstrap />
        <AppRouter />
    </React.StrictMode>
);
