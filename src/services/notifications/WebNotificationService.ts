import { localNotifications } from '../localNotifications.service';
import type { ReminderPayload, NotificationPermissionStatus, ScheduledReminder, NotificationService } from './types';

// Adaptador web: envuelve la implementación concreta actual (Web Notifications +
// Service Worker con fallback por setTimeout). Los detalles quedan encapsulados.
export const webNotificationService: NotificationService = {
    isAvailable(): boolean {
        return localNotifications.isSupported();
    },

    getPermission(): NotificationPermissionStatus {
        if (!localNotifications.isSupported()) return 'unsupported';
        return localNotifications.permission();
    },

    async requestPermission(): Promise<NotificationPermissionStatus> {
        if (!localNotifications.isSupported()) return 'unsupported';
        return localNotifications.requestPermission();
    },

    async schedule(payload: ReminderPayload): Promise<boolean> {
        return localNotifications.scheduleReminder(payload);
    },

    async cancel(tag: string): Promise<void> {
        return localNotifications.cancelReminder(tag);
    },

    async getScheduled(): Promise<ScheduledReminder[]> {
        return localNotifications.getScheduledReminders();
    },

    buildTag(entityPrefix: string, id: string): string {
        return localNotifications.buildTag(entityPrefix, id);
    },

    isScheduledNotificationTag(tag: string): boolean {
        return localNotifications.isScheduledNotificationTag(tag);
    },
};