import { useEffect } from 'react';
import { notificationService } from '../../services/notifications/NotificationService';
import type { ReminderPayload } from '../../services/notifications/types';

export function useReminderSync<T>(
    items: T[],
    buildPayload: (item: T) => ReminderPayload | null,
    deps: unknown[] = []
) {
    useEffect(() => {
        if (!notificationService.isAvailable() || notificationService.getPermission() !== 'granted') return;

        let cancelled = false;
        let inFlight = false;

        const sync = async () => {
            if (cancelled || inFlight) return;
            inFlight = true;

            try {
                const now = Date.now();
                const payloads = items
                    .map(buildPayload)
                    .filter((p): p is ReminderPayload => p !== null && p.at > now);

                const existing = await notificationService.getScheduled();
                const existingByTag = new Map(existing.map((n) => [n.tag, n]));
                const payloadByTag = new Map(payloads.map((p) => [p.tag, p]));

                // En móvil los timers del SW no sobreviven a un reinicio, así que
                // re-programamos todos los pendientes (idempotente: no duplica).
                for (const p of payloads) {
                    if (cancelled) return;
                    await notificationService.schedule(p);
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
    }, [...deps]);
}