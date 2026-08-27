export interface ReminderPayload {
    tag: string;
    title: string;
    body?: string;
    at: number;
    url: string;
}

export const REMINDER_PREFIX = 'reminder-';

interface TimestampTriggerWindow extends Window {
    TimestampTrigger: new (timestamp: number) => unknown;
}

const STORAGE_KEY = 'personos:scheduled-reminders';

function readScheduled(): Record<string, { at: number }> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Record<string, { at: number }>) : {};
    } catch {
        return {};
    }
}

function writeScheduled(map: Record<string, { at: number }>): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
        // localStorage no disponible (modo privado, sin espacio): se ignora.
    }
}

export function buildTag(entityPrefix: string, id: string): string {
    return `${REMINDER_PREFIX}${entityPrefix}-${id}`;
}

export function isScheduledNotificationTag(tag: string): boolean {
    return tag.startsWith(REMINDER_PREFIX);
}

async function sendToServiceWorker(message: unknown): Promise<void> {
    try {
        const registration = await navigator.serviceWorker.ready;
        const active = registration.active ?? navigator.serviceWorker.controller;
        active?.postMessage(message);
    } catch {
        // Sin service worker activo: se ignora.
    }
}

export const localNotifications = {
    isSupported(): boolean {
        return (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            'serviceWorker' in navigator
        );
    },

    // El Trigger API (showTrigger) solo existe en desktop (Chrome/Edge).
    // En Android casi siempre falta; ahí usamos el plan B (setTimeout en el SW).
    supportsTrigger(): boolean {
        return (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            'showTrigger' in Notification.prototype
        );
    },

    permission(): NotificationPermission {
        if (!this.isSupported()) return 'denied';
        return Notification.permission;
    },

    isPermissionGranted(): boolean {
        if (!this.isSupported()) return false;
        return Notification.permission === 'granted';
    },

    async requestPermission(): Promise<NotificationPermission> {
        if (typeof Notification === 'undefined') return 'denied';
        return Notification.requestPermission();
    },

    async scheduleReminder(p: ReminderPayload): Promise<boolean> {
        if (!this.isSupported()) return false;
        if (Notification.permission !== 'granted') return false;
        if (!p.at || p.at <= Date.now()) return false;

        // 1) Registrar localmente para poder listar/cancelar en cualquier momento.
        const scheduled = readScheduled();
        scheduled[p.tag] = { at: p.at };
        writeScheduled(scheduled);

        try {
            const registration = await navigator.serviceWorker.ready;

            // 2a) Desktop: Trigger API nativo, la notificación la dispara el SO.
            if (this.supportsTrigger()) {
                const trigger = new (window as unknown as TimestampTriggerWindow).TimestampTrigger(p.at);
                await registration.showNotification(p.title, {
                    tag: p.tag,
                    body: p.body,
                    icon: '/pwa-192x192.png',
                    data: { url: p.url },
                    showTrigger: trigger,
                } as NotificationOptions & { showTrigger: unknown });
                return true;
            }

            // 2b) Móvil/otros: el SW programa un setTimeout y muestra la notificación.
            await sendToServiceWorker({ type: 'schedule-notification', payload: p });
            return true;
        } catch {
            return false;
        }
    },

    async cancelReminder(tag: string): Promise<void> {
        const scheduled = readScheduled();
        if (tag in scheduled) {
            delete scheduled[tag];
            writeScheduled(scheduled);
        }

        await sendToServiceWorker({ type: 'cancel-reminder', tag });

        if (!this.isSupported()) return;
        try {
            const registration = await navigator.serviceWorker.ready;
            const notifications = await registration.getNotifications({ tag });
            notifications.forEach((n) => n.close());
        } catch {
            // Silencioso: no debe romper el flujo de la app.
        }
    },

    async getScheduledReminders(): Promise<{ tag: string; scheduledAt?: number }[]> {
        const scheduled = readScheduled();
        return Object.entries(scheduled)
            .map(([tag, value]) => ({ tag, scheduledAt: value.at }))
            .filter((entry) => entry.scheduledAt && entry.scheduledAt > Date.now());
    },

    buildTag,
    isScheduledNotificationTag,
};
