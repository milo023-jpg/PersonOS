import type { Task } from '../../domain/models/Task';
import { getDayRange } from '../../domain/utils/taskDate';

export function isTaskVisibleInCalendar(task: Task): boolean {
    return task.status !== 'archived';
}

export function tasksForDay(tasks: Task[], date: Date): Task[] {
    const { start, end } = getDayRange(date);
    return tasks.filter(
        (task) =>
            isTaskVisibleInCalendar(task) &&
            typeof task.dueDate === 'number' &&
            Number.isFinite(task.dueDate) &&
            task.dueDate >= start &&
            task.dueDate <= end,
    );
}

export function tasksWithoutDate(tasks: Task[]): Task[] {
    return tasks.filter(
        (task) =>
            (task.status === 'todo' || task.status === 'in_progress') &&
            !(typeof task.dueDate === 'number' && Number.isFinite(task.dueDate)),
    );
}

function dueValue(task: Task): number {
    return typeof task.dueDate === 'number' && Number.isFinite(task.dueDate)
        ? task.dueDate
        : Number.MAX_SAFE_INTEGER;
}

// Pendientes primero (por dueDate asc, fallback createdAt), completadas al final.
export function sortTasksForCalendar(tasks: Task[]): Task[] {
    const pending = tasks
        .filter((task) => task.status !== 'completed')
        .sort((a, b) => dueValue(a) - dueValue(b) || a.createdAt - b.createdAt);
    const completed = tasks
        .filter((task) => task.status === 'completed')
        .sort((a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt));
    return [...pending, ...completed];
}

export function countPending(tasks: Task[]): number {
    return tasks.filter((task) => task.status !== 'completed').length;
}

// Días atrasados: tareas pendientes con dueDate anterior al inicio de hoy.
export function isOverdue(task: Task, todayStart: number): boolean {
    return task.status !== 'completed' && typeof task.dueDate === 'number' && task.dueDate < todayStart;
}