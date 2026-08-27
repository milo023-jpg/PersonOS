import type { Task } from '../models/Task';
import type { TaskSortMode } from '../models/TaskList';
import { getDayRange } from './taskDate';

/**
 * Reglas de ordenamiento:
 * - 'manual': por `order` ascendente (null/undefined al final, fallback estable por createdAt asc).
 * - 'created_desc': por `createdAt` descendente.
 * - 'due_asc': las tareas con fecha van primero: las vencidas (dueDate < inicio de hoy)
 *   encabezan ordenadas asc por dueDate (la más atrasada primero), luego las de hoy,
 *   luego las futuras (todas asc por dueDate). Las tareas SIN fecha van al final,
 *   con orden estable por `order` o createdAt.
 * - En TODOS los modos, las tareas completadas (status === 'completed') siempre van
 *   al final del resultado, ordenadas por `completedAt` desc (fallback createdAt desc).
 */
export function sortTasksByMode(tasks: Task[], mode: TaskSortMode): Task[] {
  const active = tasks.filter((task) => task.status !== 'completed');
  const completed = tasks.filter((task) => task.status === 'completed');

  const completedSorted = completed.sort((a, b) => {
    const aTime = a.completedAt ?? a.createdAt;
    const bTime = b.completedAt ?? b.createdAt;
    return (bTime ?? 0) - (aTime ?? 0);
  });

  let activeSorted: Task[];
  switch (mode) {
    case 'created_desc':
      activeSorted = active.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      break;

    case 'due_asc': {
      const withDueDate = active.filter((task) => typeof task.dueDate === 'number' && Number.isFinite(task.dueDate));
      const withoutDueDate = active.filter((task) => typeof task.dueDate !== 'number' || !Number.isFinite(task.dueDate));

      const { start } = getDayRange();
      const overdueOrToday = withDueDate.filter((task) => (task.dueDate as number) < start);
      const restWithDueDate = withDueDate.filter((task) => (task.dueDate as number) >= start);

      // Asc por dueDate: las más atrasadas encabezan, luego hoy y luego futuras.
      overdueOrToday.sort((a, b) => (a.dueDate as number) - (b.dueDate as number));
      restWithDueDate.sort((a, b) => (a.dueDate as number) - (b.dueDate as number));

      activeSorted = [
        ...overdueOrToday,
        ...restWithDueDate,
        ...withoutDueDate.sort(byOrderThenCreatedAtAsc),
      ];
      break;
    }

    case 'manual':
    default:
      // null/undefined en `order` van al final, fallback estable por createdAt asc.
      activeSorted = active.sort(byOrderThenCreatedAtAsc);
      break;
  }

  return [...activeSorted, ...completedSorted];
}

function byCreatedAtAsc(a: Task, b: Task): number {
  return (a.createdAt ?? 0) - (b.createdAt ?? 0);
}

function byOrderThenCreatedAtAsc(a: Task, b: Task): number {
  const aOrder = typeof a.order === 'number' && Number.isFinite(a.order) ? a.order : Number.POSITIVE_INFINITY;
  const bOrder = typeof b.order === 'number' && Number.isFinite(b.order) ? b.order : Number.POSITIVE_INFINITY;
  if (aOrder !== bOrder) return aOrder - bOrder;
  return byCreatedAtAsc(a, b);
}

/**
 * Siguiente valor de `order` manual disponible: máximo actual + 1.
 * Pensado para el quick-add: la tarea nueva queda al final del orden manual.
 */
export function pickNextOrder(tasks: Task[]): number {
  return Math.max(...tasks.map((task) => (typeof task.order === 'number' && Number.isFinite(task.order) ? task.order : 0)), 0) + 1;
}