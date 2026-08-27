import { webNotificationService, type NotificationService } from './WebNotificationService';

export type { NotificationService };
export type { NotificationPermissionStatus, ReminderPayload, ScheduledReminder } from './types';

// Punto único de entrada para las notificaciones en toda la app.
// Los componentes y la lógica de aplicación dependen de esta abstracción,
// nunca de la implementación concreta (navegador o, en el futuro, Capacitor).
//
// Punto de extensión (Fase 3): cuando exista NativeNotificationService, aquí
// se seleccionará según la plataforma:
//
//   export const notificationService: NotificationService =
//       platformService.isNative() ? nativeNotificationService : webNotificationService;
//
export const notificationService: NotificationService = webNotificationService;