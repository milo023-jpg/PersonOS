import { useEffect } from 'react';
import { localNotifications, type ReminderPayload } from '../../services/localNotifications.service';

export function useReminderSync<T>(
    items: T[],
    buildPayload: (item: T) => ReminderPayload | null,
    deps: unknown[] = []
) {
    useEffect(() => {
        if (!localNotifications.isSupported() || !localNotifications.isPermissionGranted()) return;

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

                const existing = await localNotifications.getScheduledReminders();
                const existingByTag = new Map(existing.map((n) => [n.tag, n]));
                const payloadByTag = new Map(payloads.map((p) => [p.tag, p]));

                const toSchedule = payloads.filter((p) => !existingByTag.has(p.tag));
                for (const p of toSchedule) {
                    if (cancelled) return;
                    await localNotifications.scheduleReminder(p);
                }

                for (const existingTag of existingByTag.keys()) {
                    if (cancelled) return;
                    if (!payloadByTag.has(existingTag)) {
                        await localNotifications.cancelReminder(existingTag);
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