import { platformService } from '../platform/PlatformService';
import { webNotificationService } from './WebNotificationService';
import { nativeNotificationService } from './NativeNotificationService';
import type { NotificationService } from './types';

export type {
    NotificationPermissionStatus,
    NotificationService,
    ReminderPayload,
    ScheduledReminder,
} from './types';

// Punto único de entrada para las notificaciones en toda la app.
// La implementación se elige aquí según la plataforma; el resto de la
// aplicación consume la misma interfaz sin saber dónde corre.
function resolveNotificationService(): NotificationService {
    if (platformService.isNative()) {
        return nativeNotificationService;
    }
    return webNotificationService;
}

export const notificationService: NotificationService = resolveNotificationService();