export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // 0 = Domingo, 1 = Lunes...
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;

  status: TaskStatus;
  priority: TaskPriority;

  dueDate?: number; // Usamos numbers (timestamps de JS) para facilitar cliente
  scheduledDate?: number;

  createdAt: number;
  updatedAt: number;
  completedAt?: number;

  source?: 'inbox' | 'manual';
  contextId?: string;
  listId: string; // Toda tarea debe pertenecer a una lista

  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;

  estimatedTime?: number; // en minutos
  actualTime?: number;

  order: number; // para drag & drop

  parentTaskId?: string; // para subtareas entre documentos (futuro)
  subtasks: Subtask[];   // subtareas embebidas (MVP)
}
