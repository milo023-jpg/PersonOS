import { LocalNotifications } from '@capacitor/local-notifications';
import type {
    NotificationPermissionStatus,
    NotificationService,
    ReminderPayload,
    ScheduledReminder,
} from './types';

const CHANNEL_ID = 'personos-reminders';
const CHANNEL_NAME = 'Recordatorios PersonOS';
const CHANNEL_DESC = 'Recordatorios de tareas y hábitos de PersonOS.';
const CHANNEL_IMPORTANCE = 4; // Importance.High: adecuada para recordatorios.

const REMINDER_PREFIX = 'reminder-';

// Estado cacheado de permisos: el contrato exige getPermission() síncrono,
// así que se refresca en init() y en cada requestPermission().
let permissionStatus: NotificationPermissionStatus = 'default';
let actionListenerBound = false;

// FNV-1a de 32 bits → entero positivo reproducible para el ID nativo de Android.
// Una misma tarea siempre produce el mismo ID (estable y sin Math.random/Date.now).
function toNotificationId(tag: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < tag.length; i += 1) {
        hash ^= tag.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash & 0x7fffffff; // 0..2^31-1 (int positivo de Android)
}

function mapPermission(display: unknown): NotificationPermissionStatus {
    if (display === 'granted') return 'granted';
    if (display === 'denied') return 'denied';
    return 'default'; // 'prompt' o desconocido
}

async function refreshPermission(): Promise<NotificationPermissionStatus> {
    try {
        const status = await LocalNotifications.checkPermissions();
        const mapped = mapPermission(status.display);
        permissionStatus = mapped;
        return mapped;
    } catch {
        permissionStatus = 'denied';
        return 'denied';
    }
}

// Se crea de forma idempotente (si el canal ya existe, la API lo actualiza).
async function ensureNotificationChannel(): Promise<void> {
    try {
        await LocalNotifications.createChannel({
            id: CHANNEL_ID,
            name: CHANNEL_NAME,
            description: CHANNEL_DESC,
            importance: CHANNEL_IMPORTANCE,
        });
    } catch {
        // No debe romper el arranque de la app.
    }
}

function toHashRoute(path: string | undefined): string {
    const target = path && path.length > 0 ? path : '/tasks';
    return target.startsWith('#') ? target : `#${target}`;
}

async function bindActionPerformedListener(): Promise<void> {
    if (actionListenerBound) return;
    actionListenerBound = true;
    try {
        await LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
            const extra = notification.extra as { url?: string } | undefined;
            window.location.hash = toHashRoute(extra?.url);
        });
    } catch {
        actionListenerBound = false;
    }
}

export const nativeNotificationService: NotificationService = {
    isAvailable(): boolean {
        return true; // En Android la capa nativa siempre está disponible.
    },

    async init(): Promise<void> {
        await ensureNotificationChannel();
        await refreshPermission();
        await bindActionPerformedListener();
    },

    getPermission(): NotificationPermissionStatus {
        return permissionStatus;
    },

    async requestPermission(): Promise<NotificationPermissionStatus> {
        try {
            const status = await LocalNotifications.requestPermissions();
            permissionStatus = mapPermission(status.display);
        } catch {
            permissionStatus = 'denied';
        }
        return permissionStatus;
    },

    async schedule(payload: ReminderPayload): Promise<boolean> {
        if (!payload.at || payload.at <= Date.now()) return false;

        // Si el cache aún no está definido (app recién abierta), se refresca
        // para no rechazar notificaciones con permiso ya concedido.
        if (permissionStatus === 'default') {
            await refreshPermission();
        }
        if (permissionStatus !== 'granted') return false;

        try {
            // Mismo ID → Capacitor reemplaza la anterior (operación idempotente).
            await LocalNotifications.schedule({
                notifications: [
                    {
                        id: toNotificationId(payload.tag),
                        title: payload.title,
                        body: payload.body ?? '',
                        channelId: CHANNEL_ID,
                        extra: { tag: payload.tag, url: payload.url },
                        schedule: { at: new Date(payload.at) },
                    },
                ],
            });
            return true;
        } catch {
            return false;
        }
    },

    async cancel(tag: string): Promise<void> {
        try {
            await LocalNotifications.cancel({ notifications: [{ id: toNotificationId(tag) }] });
        } catch {
            // No debe romper el flujo si la notificación ya no existe.
        }
    },

    async getScheduled(): Promise<ScheduledReminder[]> {
        try {
            const result = await LocalNotifications.getPending();
            return result.notifications.flatMap((notification): ScheduledReminder[] => {
                const info = notification.extra as { tag?: string } | undefined;
                if (typeof info?.tag !== 'string') return [];
                const at = notification.schedule?.at
                    ? new Date(notification.schedule.at).getTime()
                    : undefined;
                return [{ tag: info.tag, ...(at !== undefined ? { scheduledAt: at } : {}) }];
            });
        } catch {
            return [];
        }
    },

    buildTag(entityPrefix: string, id: string): string {
        return `${REMINDER_PREFIX}${entityPrefix}-${id}`;
    },

    isScheduledNotificationTag(tag: string): boolean {
        return tag.startsWith(REMINDER_PREFIX);
    },
};