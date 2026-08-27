import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

type PrecacheManifestEntry = { url: string; revision?: string };

declare global {
    interface Window {
        __WB_MANIFEST: Array<string | PrecacheManifestEntry>;
    }
}

interface NotificationClickEvent {
    notification: { close(): void; data?: { url?: string } };
    waitUntil(promise: Promise<unknown>): void;
}

interface ActivateEvent {
    waitUntil(promise: Promise<unknown>): void;
}

interface NavigatedClient {
    focus(): Promise<unknown>;
}

interface WindowClientLike {
    url: string;
    navigate(url: string): Promise<NavigatedClient | null>;
    focus(): Promise<unknown>;
}

interface SwMessageEvent {
    data: unknown;
}

interface ReminderPayload {
    tag: string;
    title: string;
    body?: string;
    at: number;
    url: string;
}

interface SwScope {
    skipWaiting(): void;
    addEventListener(type: 'notificationclick', listener: (event: NotificationClickEvent) => void): void;
    addEventListener(type: 'activate', listener: (event: ActivateEvent) => void): void;
    addEventListener(type: 'message', listener: (event: SwMessageEvent) => void): void;
    setTimeout(callback: () => void, delay: number): number;
    clearTimeout(id: number): void;
    registration: {
        showNotification(title: string, options: NotificationOptions): Promise<void>;
    };
    clients: {
        claim(): Promise<unknown>;
        matchAll(options: unknown): Promise<WindowClientLike[]>;
        openWindow(url: string): Promise<unknown>;
    };
}

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

const sw = self as unknown as SwScope;

sw.skipWaiting();

sw.addEventListener('activate', (event) => {
    event.waitUntil(sw.clients.claim());
});

// ── Recordatorios programados (plan B cuando no existe el Trigger API) ──
// Mantiene un timer por tag y re-utiliza la notificación programada nativa si existe.
const scheduledTimers = new Map<string, number>();

function showReminder(payload: ReminderPayload): Promise<void> {
    return sw.registration.showNotification(payload.title, {
        tag: payload.tag,
        body: payload.body,
        icon: '/pwa-192x192.png',
        data: { url: payload.url },
    });
}

function scheduleWithTimeout(payload: ReminderPayload): void {
    const delay = payload.at - Date.now();
    if (delay <= 0) {
        void showReminder(payload).catch(() => {});
        return;
    }

    const existing = scheduledTimers.get(payload.tag);
    if (existing !== undefined) {
        sw.clearTimeout(existing);
    }

    const timer = sw.setTimeout(() => {
        scheduledTimers.delete(payload.tag);
        void showReminder(payload).catch(() => {});
    }, delay);

    scheduledTimers.set(payload.tag, timer);
}

sw.addEventListener('message', (event) => {
    const data = event.data as { type?: string; payload?: ReminderPayload; tag?: string } | undefined;
    if (!data) return;

    if (data.type === 'schedule-notification' && data.payload) {
        scheduleWithTimeout(data.payload);
    } else if (data.type === 'cancel-reminder' && data.tag) {
        const timer = scheduledTimers.get(data.tag);
        if (timer !== undefined) {
            sw.clearTimeout(timer);
            scheduledTimers.delete(data.tag);
        }
    }
});

sw.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        sw.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                const targetOrigin = new URL(urlToOpen, self.location.origin).origin;

                for (const client of clientList) {
                    const clientOrigin = new URL(client.url).origin;
                    if (clientOrigin !== targetOrigin) continue;

                    return client.navigate(urlToOpen).then((navigatedClient) => {
                        if (navigatedClient) return navigatedClient.focus();
                        return client.focus();
                    });
                }

                return sw.clients.openWindow(urlToOpen);
            })
    );
});

export {};