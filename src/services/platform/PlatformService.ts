interface CapacitorRuntime {
    getPlatform?: () => string;
    isNativePlatform?: () => boolean;
}

function getCapacitor(): CapacitorRuntime | undefined {
    if (typeof window === 'undefined') return undefined;
    return (window as unknown as { Capacitor?: CapacitorRuntime }).Capacitor;
}

export const platformService = {
    // ¿La app corre dentro de un runtime nativo (Capacitor)?
    isNative(): boolean {
        const capacitor = getCapacitor();
        if (!capacitor) return false;
        return typeof capacitor.isNativePlatform === 'function'
            ? capacitor.isNativePlatform()
            : capacitor.getPlatform?.() !== 'web';
    },

    // ¿Plataforma Android nativa?
    isAndroid(): boolean {
        const capacitor = getCapacitor();
        if (!this.isNative()) return false;
        return capacitor?.getPlatform?.() === 'android';
    },

    // ¿Estamos en un navegador estándar (incluye la PWA instalada en modo standalone)?
    isWeb(): boolean {
        return !this.isNative();
    },

    // ¿Se ejecuta como PWA instalada (mode standalone / pantalla de inicio)?
    isPWA(): boolean {
        if (typeof window === 'undefined') return false;
        const display = window.matchMedia?.('(display-mode: standalone)');
        if (display?.matches) return true;
        return (navigator as unknown as { standalone?: boolean }).standalone === true;
    },

    // Capacidad genérica de notificaciones programadas en la plataforma actual.
    // En la web requiere Notification API + service worker; en nativo (Fase 3)
    // delegará en el plugin de Local Notifications de Capacitor.
    supportsNotifications(): boolean {
        return (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            'serviceWorker' in navigator
        );
    },
};