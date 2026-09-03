import type { RecurrenceRule, Task } from '../../domain/models/Task';
import { toTaskDateTimestamp } from '../../domain/utils/taskDate';

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * DAY_MS);
}

// Retorna el lunes 00:00 de la semana calendario que contiene a `date`.
function startOfWeek(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    const day = result.getDay(); // 0 = Domingo
    const offset = day === 0 ? -6 : 1 - day; // considera lunes como inicio de semana
    result.setDate(result.getDate() + offset);
    return result;
}

function sameTimeOnDate(base: Date, day: number, month: number, year: number): Date {
    return new Date(year, month, day, base.getHours(), base.getMinutes(), base.getSeconds(), base.getMilliseconds());
}

// Próxima ocurrencia diaria: base + interval días (preservando la hora).
function nextDaily(base: Date, rule: RecurrenceRule): Date {
    return addDays(base, rule.interval);
}

// Próxima ocurrencia semanal SIN días explícitos: mismo día de la semana,
// interval semanas después.
function nextWeekly(base: Date, rule: RecurrenceRule): Date {
    return addDays(base, rule.interval * 7);
}

// Próxima ocurrencia semanal CON días explícitos: busca el siguiente día en
// `daysOfWeek` dentro de una "semana activa" (la semana de la base cuenta como
// semana 0 y luego cada `interval` semanas calendario).
function nextWeeklyWithDays(base: Date, rule: RecurrenceRule): Date {
    const daysOfWeek = rule.daysOfWeek ?? [];
    if (daysOfWeek.length === 0) return nextWeekly(base, rule);

    const interval = Math.max(1, rule.interval || 1);
    const weekBase = startOfWeek(base);

    for (let step = 0; step < 366; step += 1) {
        const weekStart = addDays(weekBase, step * interval * 7);

        for (let offset = 0; offset < 7; offset += 1) {
            const candidate = addDays(weekStart, offset);
            if (candidate.getTime() <= base.getTime()) continue;

            if (daysOfWeek.includes(candidate.getDay())) {
                return candidate;
            }
        }
    }

    // Fallback defensivo: nunca debería alcanzarse.
    return addDays(base, interval * 7);
}

// Próxima ocurrencia mensual: mismo día del mes, `interval` meses después,
// clampeado al último día del mes si el día no existe (ej. 31 de enero → feb).
function nextMonthly(base: Date, rule: RecurrenceRule): Date {
    const day = base.getDate();
    const targetMonth = base.getMonth() + rule.interval;
    const firstOfTarget = new Date(base.getFullYear(), targetMonth, 1);
    const lastDayOfTarget = new Date(base.getFullYear(), targetMonth + 1, 0).getDate();
    const clampedDay = Math.min(day, lastDayOfTarget);

    return sameTimeOnDate(base, clampedDay, firstOfTarget.getMonth(), firstOfTarget.getFullYear());
}

/**
 * Calcula el timestamp de la próxima ocurrencia de una regla de recurrencia
 * a partir de una fecha base (la fecha actual de la tarea). Preserva la hora
 * original de `base`.
 */
export function computeNextDueDate(baseTimestamp: number, rule: RecurrenceRule): number {
    const base = new Date(baseTimestamp);
    const normalizedRule: RecurrenceRule = {
        type: rule.type,
        interval: rule.interval > 0 ? rule.interval : 1,
        ...(rule.daysOfWeek && rule.daysOfWeek.length > 0 ? { daysOfWeek: rule.daysOfWeek } : {}),
    };

    let next: Date;
    switch (normalizedRule.type) {
        case 'daily':
            next = nextDaily(base, normalizedRule);
            break;
        case 'weekly':
            next = normalizedRule.daysOfWeek && normalizedRule.daysOfWeek.length > 0
                ? nextWeeklyWithDays(base, normalizedRule)
                : nextWeekly(base, normalizedRule);
            break;
        case 'monthly':
            next = nextMonthly(base, normalizedRule);
            break;
        default:
            next = addDays(base, normalizedRule.interval);
    }

    return next.getTime();
}

/**
 * Retorna el timestamp de la próxima ocurrencia si la tarea es recurrente,
 * o null en caso contrario. Usa dueDate como fuente primaria y
 * scheduledDate como respaldo.
 */
export function getNextDueDate(task: Task): number | null {
    if (!task.isRecurring || !task.recurrenceRule) return null;

    const base = toTaskDateTimestamp(task.dueDate ?? task.scheduledDate);
    if (base === undefined) return null;

    return computeNextDueDate(base, task.recurrenceRule);
}

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Etiqueta legible de la regla para chips y badges (ej. "Cada mes", "Cada lun y jue").
export function getRecurrenceLabel(rule: RecurrenceRule | undefined): string {
    if (!rule) return '';

    const every = rule.interval > 0 ? rule.interval : 1;

    switch (rule.type) {
        case 'daily':
            return every === 1 ? 'Cada día' : `Cada ${every} días`;
        case 'weekly': {
            if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
                const days = rule.daysOfWeek
                    .slice()
                    .sort((a, b) => a - b)
                    .map((day) => WEEKDAY_LABELS[day])
                    .join(', ');
                return every === 1 ? `Cada ${days}` : `Cada ${every} semanas: ${days}`;
            }
            return every === 1 ? 'Cada semana' : `Cada ${every} semanas`;
        }
        case 'monthly':
            return every === 1 ? 'Cada mes' : `Cada ${every} meses`;
        default:
            return '';
    }
}

export function getRecurrenceShortLabel(rule: RecurrenceRule | undefined): string {
    if (!rule) return '';

    switch (rule.type) {
        case 'daily':
            return 'Diaria';
        case 'weekly':
            return rule.daysOfWeek && rule.daysOfWeek.length > 0 ? 'Semanal (días)' : 'Semanal';
        case 'monthly':
            return 'Mensual';
        default:
            return 'Recurrente';
    }
}