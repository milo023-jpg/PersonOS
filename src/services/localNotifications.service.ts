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

interface ScheduledNotification {
    showTrigger?: { timestamp?: number };
}

export function buildTag(entityPrefix: string, id: string): string {
    return `${REMINDER_PREFIX}${entityPrefix}-${id}`;
}

export function isScheduledNotificationTag(tag: string): boolean {
    return tag.startsWith(REMINDER_PREFIX);
}

export const localNotifications = {
    isSupported(): boolean {
        return (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            'serviceWorker' in navigator &&
            'showTrigger' in Notification.prototype
        );
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

        try {
            const registration = await navigator.serviceWorker.ready;
            const trigger = new (window as unknown as TimestampTriggerWindow).TimestampTrigger(p.at);

            await registration.showNotification(
                p.title,
                {
                    tag: p.tag,
                    body: p.body,
                    icon: '/pwa-192x192.png',
                    data: { url: p.url },
                    showTrigger: trigger,
                } as NotificationOptions & { showTrigger: unknown }
            );

            return true;
        } catch {
            return false;
        }
    },

    async cancelReminder(tag: string): Promise<void> {
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
        if (!this.isSupported()) return [];

        try {
            const registration = await navigator.serviceWorker.ready;
            const notifications = await registration.getNotifications();
            return notifications.map((n) => ({
                tag: n.tag,
                scheduledAt: (n as unknown as ScheduledNotification).showTrigger?.timestamp,
            }));
        } catch {
            return [];
        }
    },

    buildTag,
    isScheduledNotificationTag,
};