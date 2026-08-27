import type { Task, CustomReminder } from '../../domain/models/Task';
import { notificationService } from '../../../../services/notifications/NotificationService';
import type { ReminderPayload } from '../../../../services/notifications/types';
import { getLocalISODate } from '../../../../utils/dateUtils';

const REMINDER_TITLE_MAX = 60;
const MAX_LISTED_SUBTASKS = 5;

// Categorías de notificaciones (identidad estable para evitar duplicados).
export const NOTIFICATION_KIND = {
    AUTOMATIC_DUE_SOON: 'due-soon',
    AUTOMATIC_DUE: 'due',
    CUSTOM_REMINDER: 'custom',
    DAILY_SUMMARY: 'summary',
} as const;

const oneHourMs = 60 * 60 * 1000;

function autoDueSoonTag(taskId: string): string {
    return `reminder-task-${taskId}-${NOTIFICATION_KIND.AUTOMATIC_DUE_SOON}`;
}

function autoDueTag(taskId: string): string {
    return `reminder-task-${taskId}-${NOTIFICATION_KIND.AUTOMATIC_DUE}`;
}

function customTag(taskId: string, reminderId: string): string {
    return `reminder-task-${taskId}-${NOTIFICATION_KIND.CUSTOM_REMINDER}-${reminderId}`;
}

export const DAILY_SUMMARY_TAG = `reminder-${NOTIFICATION_KIND.DAILY_SUMMARY}`;

// Entradas de recordatorios personalizados: prioriza customReminders (incluso
// vacío, lo que permite borrarlos todos). Si el campo aún no existe, migra el
// legacy reminderAt como un único recordatorio.
export function getEffectiveReminders(task: Task): CustomReminder[] {
    if (Array.isArray(task.customReminders)) {
        return task.customReminders;
    }
    if (task.reminderAt) {
        return [{ id: 'legacy', at: task.reminderAt }];
    }
    return [];
}

function truncateTitle(title: string): string {
    return title.length > REMINDER_TITLE_MAX ? `${title.slice(0, REMINDER_TITLE_MAX - 3)}...` : title;
}

function formatReminderDate(timestamp: number): string {
    const date = new Date(timestamp);
    const isMidnight = date.getHours() === 0 && date.getMinutes() === 0;

    if (isMidnight) {
        return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    return date.toLocaleString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function buildReminderBody(task: Task): string {
    const lines: string[] = [];

    const taskDate = task.dueDate ?? task.scheduledDate;
    if (taskDate) {
        lines.push(`📅 ${formatReminderDate(taskDate)}`);
    }

    const subtasks = task.subtasks ?? [];
    const pending = subtasks.filter((subtask) => !subtask.completed);
    const completedCount = subtasks.length - pending.length;

    const listed = pending.slice(0, MAX_LISTED_SUBTASKS);
    for (const subtask of listed) {
        lines.push(`☐ ${subtask.title}`);
    }
    const remainingPending = pending.length - listed.length;
    if (remainingPending > 0) {
        lines.push(`⋯ ${remainingPending} pendientes más`);
    }
    if (completedCount > 0) {
        lines.push(`☑ ${completedCount} completadas`);
    }

    return lines.join('\n');
}

function buildAutomaticPayloads(task: Task): ReminderPayload[] {
    if (!task.dueDate) return [];

    const now = Date.now();
    const due = task.dueDate;
    const title = truncateTitle(task.title);
    const body = buildReminderBody(task);
    const payloads: ReminderPayload[] = [];

    // En el momento de la fecha límite.
    if (due > now) {
        payloads.push({
            tag: autoDueTag(task.id),
            title: `⏰ Venció la fecha límite: ${title}`,
            body,
            at: due,
            url: '/tasks',
        });
    }

    // Una hora antes (omitir si la fecha límite está a menos de 1 hora).
    const oneHourBefore = due - oneHourMs;
    if (oneHourBefore > now) {
        payloads.push({
            tag: autoDueSoonTag(task.id),
            title: `🔔 Tienes 1 hora para completar: ${title}`,
            body,
            at: oneHourBefore,
            url: '/tasks',
        });
    }

    return payloads;
}

function buildCustomPayloads(task: Task): ReminderPayload[] {
    const now = Date.now();
    const title = truncateTitle(task.title);
    const body = buildReminderBody(task);

    return getEffectiveReminders(task)
        .filter((reminder) => reminder.at > now)
        .map((reminder) => ({
            tag: customTag(task.id, reminder.id),
            title: `🔔 Recordatorio: ${title}`,
            body,
            at: reminder.at,
            url: '/tasks',
        }));
}

// Notificaciones de una sola tarea (automáticas + personalizadas).
export function buildSingleTaskReminders(task: Task): ReminderPayload[] {
    if (task.status === 'completed') return [];
    return [...buildAutomaticPayloads(task), ...buildCustomPayloads(task)];
}

// Próxima fecha local con la hora indicada. Si ya ocurrió hoy, pasa a mañana.
function nextLocalTime(hour: number, minute: number): number {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    if (date.getTime() <= Date.now()) {
        date.setDate(date.getDate() + 1);
    }
    return date.getTime();
}

// Resumen diario: una sola notificación agrupada a las 8:00 AM local.
export function buildDailySummaryReminder(tasks: Task[]): ReminderPayload | null {
    const today = getLocalISODate();
    const pending = tasks.filter((task) => task.status !== 'completed');

    const todayCount = pending.filter((task) => {
        if (!task.dueDate) return false;
        return getLocalISODate(new Date(task.dueDate)) === today;
    }).length;

    const overdueCount = pending.filter((task) => {
        if (!task.dueDate) return false;
        return getLocalISODate(new Date(task.dueDate)) < today;
    }).length;

    if (todayCount === 0 && overdueCount === 0) return null;

    let body: string;
    if (todayCount > 0 && overdueCount > 0) {
        body = `Tienes ${todayCount} pendientes hoy y ${overdueCount} tareas atrasadas.`;
    } else if (todayCount > 0) {
        body = `Tienes ${todayCount} pendientes para hoy.`;
    } else {
        body = `Tienes ${overdueCount} tareas atrasadas.`;
    }

    return {
        tag: DAILY_SUMMARY_TAG,
        title: overdueCount > 0 ? '⚠️ Buenos días' : '☀️ Buenos días',
        body,
        at: nextLocalTime(8, 0),
        url: '/tasks',
    };
}

// Todos los payloads de una lista de tareas más el resumen diario.
// Es la fuente de verdad para useReminderSync (idempotente, sin duplicados).
export function buildTaskReminders(tasks: Task[]): ReminderPayload[] {
    const payloads = tasks.flatMap((task) => buildSingleTaskReminders(task));
    const summary = buildDailySummaryReminder(tasks);
    if (summary) {
        payloads.push(summary);
    }
    return payloads;
}

// Tags programables de una tarea (para cancelación explícita al completar/eliminar).
function getTaskReminderTags(task: Task): string[] {
    const tags: string[] = [autoDueSoonTag(task.id), autoDueTag(task.id)];
    for (const reminder of getEffectiveReminders(task)) {
        tags.push(customTag(task.id, reminder.id));
    }
    return tags;
}

export async function cancelTaskReminders(task: Task): Promise<void> {
    await Promise.all(getTaskReminderTags(task).map((tag) => notificationService.cancel(tag)));
}

// Compat: cancelación por ID cuando no se tiene la tarea completa.
// Nota: solo cubre los tags automáticos; usar cancelTaskReminders con la tarea
// cuando se disponga del estado completo.
export function cancelTaskReminder(taskId: string): Promise<void> {
    return notificationService.cancel(autoDueSoonTag(taskId)).then(() =>
        notificationService.cancel(autoDueTag(taskId))
    );
}