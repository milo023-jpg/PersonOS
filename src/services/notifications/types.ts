export interface ReminderPayload {
    tag: string;
    title: string;
    body?: string;
    at: number;
    url: string;
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface ScheduledReminder {
    tag: string;
    scheduledAt?: number;
}