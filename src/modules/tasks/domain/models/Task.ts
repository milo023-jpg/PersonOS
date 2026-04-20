export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

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


  contextId?: string;
  listId?: string; // Para agrupamiento en listas personalizadas

  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;

  estimatedTime?: number; // en minutos
  actualTime?: number;

  order: number; // para drag & drop
  
  isImportant: boolean;
  isInbox: boolean;

  parentTaskId?: string; // para subtareas
}
