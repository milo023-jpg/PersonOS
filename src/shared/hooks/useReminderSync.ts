import { useEffect, type DependencyList } from 'react';
import { notificationService } from '../../services/notifications/NotificationService';
import type { ReminderPayload } from '../../services/notifications/types';

// Orquestador de sincronización: recibe los payloads que DEBEN existir y
// sincroniza con el sistema de notificaciones de la plataforma:
//  1. Programa todos los pendientes (idempotente, no duplica).
//  2. Cancela los que ya no corresponden (tarea completada, fecha eliminada,
//     recordatorio borrado, etc.).
export function useReminderSync(payloads: ReminderPayload[], deps: DependencyList) {
    useEffect(() => {
        if (!notificationService.isAvailable() || notificationService.getPermission() !== 'granted') return;

        let cancelled = false;
        let inFlight = false;

        const now = Date.now();
        const payloadsToSchedule = payloads.filter((payload) => payload.at > now);

        const sync = async () => {
            if (cancelled || inFlight) return;
            inFlight = true;

            try {
                const existing = await notificationService.getScheduled();
                const existingByTag = new Map(existing.map((notification) => [notification.tag, notification]));
                const payloadByTag = new Map(payloadsToSchedule.map((payload) => [payload.tag, payload]));

                for (const payload of payloadsToSchedule) {
                    if (cancelled) return;
                    await notificationService.schedule(payload);
                }

                for (const existingTag of existingByTag.keys()) {
                    if (cancelled) return;
                    if (!payloadByTag.has(existingTag)) {
                        await notificationService.cancel(existingTag);
                    }
                }
            } finally {
                inFlight = false;
            }
        };

        void sync();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}