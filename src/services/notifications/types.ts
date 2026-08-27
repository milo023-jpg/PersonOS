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

// Contrato único que consume el resto de la aplicación. Las implementaciones
// (web y nativa) traducen estas operaciones abstractas a su API concreta.
export interface NotificationService {
    // ¿Se puede programar notificaciones en esta plataforma?
    isAvailable(): boolean;

    // Inicialización perezosa (canales, listeners, refresco de permisos).
    // Opcional: en web no es necesario.
    init?(): Promise<void> | void;

    getPermission(): NotificationPermissionStatus;
    requestPermission(): Promise<NotificationPermissionStatus>;

    // Programar (idempotente por tag). false si no se pudo programar.
    schedule(payload: ReminderPayload): Promise<boolean>;

    // Cancelar por tag (operación no destructiva si no existe).
    cancel(tag: string): Promise<void>;

    // Recordatorios pendientes para poder sincronizar.
    getScheduled(): Promise<ScheduledReminder[]>;

    // Estrategia de tags: `{entityPrefix}-{id}`.
    buildTag(entityPrefix: string, id: string): string;
    isScheduledNotificationTag(tag: string): boolean;
}