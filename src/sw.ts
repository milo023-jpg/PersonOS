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

interface SwScope {
    skipWaiting(): void;
    addEventListener(type: 'notificationclick', listener: (event: NotificationClickEvent) => void): void;
    addEventListener(type: 'activate', listener: (event: ActivateEvent) => void): void;
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