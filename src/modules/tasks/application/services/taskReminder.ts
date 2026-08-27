import type { Task } from '../../domain/models/Task';
import { notificationService } from '../../../../services/notifications/NotificationService';
import type { ReminderPayload } from '../../../../services/notifications/types';

export function buildTaskReminder(task: Task): ReminderPayload | null {
    if (!task.reminderAt || task.reminderAt <= Date.now()) return null;
    if (task.status === 'completed') return null;

    const truncatedTitle = task.title.length > 60 ? `${task.title.slice(0, 57)}...` : task.title;

    return {
        tag: notificationService.buildTag('task', task.id),
        title: `Recordatorio: ${truncatedTitle}`,
        body: 'Tienes una tarea pendiente',
        at: task.reminderAt,
        url: '/tasks',
    };
}

export function cancelTaskReminder(taskId: string): Promise<void> {
    return notificationService.cancel(notificationService.buildTag('task', taskId));
}