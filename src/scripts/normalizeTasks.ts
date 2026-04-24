import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { GENERAL_LIST, GENERAL_LIST_ID } from '../modules/tasks/domain/constants/defaults';
import type {
  RecurrenceRule,
  Subtask,
  Task,
  TaskPriority,
  TaskStatus,
} from '../modules/tasks/domain/models/Task';

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'completed', 'archived'];
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const VALID_RECURRENCE_TYPES: RecurrenceRule['type'][] = ['daily', 'weekly', 'monthly'];

export type TaskDocument = Partial<Task> & { id: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function sanitizeSubtasks(value: unknown, now: number): Subtask[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!isRecord(item)) return [];

    const title = asNonEmptyString(item.title);
    if (!title) return [];

    return [
      {
        id: asNonEmptyString(item.id) ?? `subtask-${now}-${index}`,
        title,
        completed: asBoolean(item.completed) ?? false,
        createdAt: asNumber(item.createdAt) ?? now,
      },
    ];
  });
}

export function sanitizeRecurrenceRule(value: unknown): RecurrenceRule | undefined {
  if (!isRecord(value)) return undefined;

  const rawType = value.type;
  if (!VALID_RECURRENCE_TYPES.includes(rawType as RecurrenceRule['type'])) {
    return undefined;
  }
  const type = rawType as RecurrenceRule['type'];

  const interval = asNumber(value.interval) ?? 1;
  const daysOfWeek = Array.isArray(value.daysOfWeek)
    ? value.daysOfWeek.filter((day): day is number => typeof day === 'number' && day >= 0 && day <= 6)
    : undefined;

  return {
    type,
    interval: interval > 0 ? interval : 1,
    ...(daysOfWeek && daysOfWeek.length > 0 ? { daysOfWeek } : {}),
  };
}

export function normalizeTaskDocument(task: TaskDocument, userId: string) {
  const now = Date.now();
  const subtasks = sanitizeSubtasks(task.subtasks, now);
  const status = VALID_STATUSES.includes(task.status as TaskStatus) ? (task.status as TaskStatus) : 'todo';
  const isRecurring = asBoolean(task.isRecurring) ?? false;
  const recurrenceRule = isRecurring ? sanitizeRecurrenceRule(task.recurrenceRule) : undefined;
  const normalizedTask: Omit<Task, 'id'> = {
    userId: asNonEmptyString(task.userId) ?? userId,
    title: asNonEmptyString(task.title) ?? 'Untitled task',
    ...(asNonEmptyString(task.description) ? { description: asNonEmptyString(task.description) } : {}),
    status,
    priority: VALID_PRIORITIES.includes(task.priority as TaskPriority) ? (task.priority as TaskPriority) : 'medium',
    ...(asNumber(task.dueDate) !== undefined ? { dueDate: asNumber(task.dueDate) } : {}),
    ...(asNumber(task.scheduledDate) !== undefined ? { scheduledDate: asNumber(task.scheduledDate) } : {}),
    createdAt: asNumber(task.createdAt) ?? now,
    updatedAt: asNumber(task.updatedAt) ?? now,
    ...(status === 'completed' ? { completedAt: asNumber(task.completedAt) ?? now } : {}),
    source: task.source === 'inbox' || task.source === 'manual' ? task.source : 'manual',
    ...(asNonEmptyString(task.contextId) ? { contextId: asNonEmptyString(task.contextId) } : {}),
    listId: asNonEmptyString(task.listId) ?? GENERAL_LIST_ID,
    isRecurring,
    ...(recurrenceRule ? { recurrenceRule } : {}),
    ...(asNumber(task.estimatedTime) !== undefined ? { estimatedTime: asNumber(task.estimatedTime) } : {}),
    ...(asNumber(task.actualTime) !== undefined ? { actualTime: asNumber(task.actualTime) } : {}),
    isImportant: asBoolean(task.isImportant) ?? false,
    order: asNumber(task.order) ?? 0,
    ...(asNonEmptyString(task.parentTaskId) ? { parentTaskId: asNonEmptyString(task.parentTaskId) } : {}),
    subtasks,
  };

  return normalizedTask;
}

function taskNeedsNormalization(task: TaskDocument, normalizedTask: Omit<Task, 'id'>) {
  return JSON.stringify(task) !== JSON.stringify({ id: task.id, ...normalizedTask });
}

export async function normalizeTasksForUser(userId: string) {
  if (!userId) {
    throw new Error('normalizeTasksForUser requiere un userId válido.');
  }

  console.log(`Normalizando tareas para el usuario: ${userId}`);

  await ensureGeneralListExists(userId);

  const tasksRef = collection(db, `users/${userId}/tasks`);
  const snapshot = await getDocs(tasksRef);

  if (snapshot.empty) {
    console.log('No hay tareas para normalizar.');
    return { scanned: 0, updated: 0 };
  }

  let updated = 0;
  let scanned = 0;
  let batch = writeBatch(db);
  let batchOperations = 0;

  for (const taskDoc of snapshot.docs) {
    scanned += 1;
    const currentTask = { id: taskDoc.id, ...taskDoc.data() } as TaskDocument;
    const normalizedTask = normalizeTaskDocument(currentTask, userId);

    if (!taskNeedsNormalization(currentTask, normalizedTask)) {
      continue;
    }

    batch.set(doc(tasksRef, taskDoc.id), { id: taskDoc.id, ...normalizedTask });
    batchOperations += 1;
    updated += 1;

    if (batchOperations === 400) {
      await batch.commit();
      batch = writeBatch(db);
      batchOperations = 0;
    }
  }

  if (batchOperations > 0) {
    await batch.commit();
  }

  console.log(`Normalización terminada. Revisadas: ${scanned}. Actualizadas: ${updated}.`);
  return { scanned, updated };
}

async function ensureGeneralListExists(userId: string) {
  const generalListRef = doc(db, `users/${userId}/taskLists`, GENERAL_LIST_ID);
  const batch = writeBatch(db);

  batch.set(
    generalListRef,
    {
      ...GENERAL_LIST,
      userId,
      createdAt: Date.now(),
    },
    { merge: true }
  );

  await batch.commit();
}
