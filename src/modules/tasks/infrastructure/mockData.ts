import type { Task } from '../domain/models/Task';
import type { TaskStats } from '../domain/models/TaskStats';
import { GENERAL_LIST_ID } from '../domain/constants/defaults';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const generateMockTasks = (userId: string): Task[] => [
  {
    id: 't-1',
    userId,
    title: 'Aterrizar arquitectura del OS Personal',
    description: 'Decidir si usamos Zustand o Context, preparar entidades de Clean Architecture.',
    status: 'completed',
    priority: 'urgent',
    dueDate: now - 1 * day,
    createdAt: now - 3 * day,
    updatedAt: now - 1 * day,
    completedAt: now - 1 * day,
    listId: GENERAL_LIST_ID,
    isRecurring: false,
    order: 0,
    isImportant: true,
    estimatedTime: 120,
    actualTime: 140
  },
  {
    id: 't-2',
    userId,
    title: 'Grabar demo del Dashboard',
    description: 'Grabar loom mostrando los últimos widgets agregados.',
    status: 'in_progress',
    priority: 'high',
    dueDate: now + 1 * day,
    createdAt: now - 1 * day,
    updatedAt: now,
    listId: GENERAL_LIST_ID,
    isRecurring: false,
    order: 0,
    isImportant: true,
    estimatedTime: 45
  },
  {
    id: 't-3',
    userId,
    title: 'Ideas de posts para LinkedIn',
    description: 'Borradores de la semana: \n1. Clean code\n2. Zustand vs Redux\n3. Motivación',
    status: 'todo',
    priority: 'medium',
    createdAt: now,
    updatedAt: now,
    listId: GENERAL_LIST_ID,
    isRecurring: false,
    order: 0,
    isImportant: false,
  },
  {
    id: 't-4',
    userId,
    title: 'Renovar dominio',
    status: 'todo',
    priority: 'medium',
    dueDate: now - 2 * day, // Vencida
    createdAt: now - 10 * day,
    updatedAt: now - 10 * day,
    listId: GENERAL_LIST_ID,
    isRecurring: true,
    recurrenceRule: { type: 'monthly', interval: 1 },
    order: 1,
    isImportant: false,
  },
  {
    id: 't-5',
    userId,
    title: 'Leer 20 páginas de Clean Architecture',
    status: 'todo',
    priority: 'low',
    dueDate: now, // Hoy
    createdAt: now,
    updatedAt: now,
    listId: GENERAL_LIST_ID,
    isRecurring: true,
    recurrenceRule: { type: 'daily', interval: 1 },
    order: 2,
    isImportant: false,
  }
];

export const generateMockTaskStats = (userId: string): TaskStats => {
    const defaultDate = new Date().toISOString().split('T')[0];
    return {
        id: `${userId}_${defaultDate}`,
        userId,
        date: defaultDate,
        tasksCreated: 5,
        tasksCompleted: 1,
        completionRate: 20,
        byPriority: { low: 1, medium: 2, high: 1, urgent: 1 },
        overdueTasks: 1
    };
};
