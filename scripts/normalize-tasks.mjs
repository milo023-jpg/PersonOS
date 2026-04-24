import { initializeApp } from 'firebase/app';
import { collection, doc, getDocs, getFirestore, writeBatch } from 'firebase/firestore';
import { loadEnv } from 'vite';

const VALID_STATUSES = ['todo', 'in_progress', 'completed', 'archived'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_RECURRENCE_TYPES = ['daily', 'weekly', 'monthly'];
const GENERAL_LIST_ID = 'general';
const GENERAL_LIST = {
  id: GENERAL_LIST_ID,
  name: 'General',
  color: 'bg-emerald-500',
  order: 0,
  isDefault: true,
};

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value) {
  return typeof value === 'boolean' ? value : undefined;
}

function sanitizeSubtasks(value, now) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!isRecord(item)) return [];

    const title = asNonEmptyString(item.title);
    if (!title) return [];

    return [{
      id: asNonEmptyString(item.id) ?? `subtask-${now}-${index}`,
      title,
      completed: asBoolean(item.completed) ?? false,
      createdAt: asNumber(item.createdAt) ?? now,
    }];
  });
}

function sanitizeRecurrenceRule(value) {
  if (!isRecord(value)) return undefined;

  const type = value.type;
  if (!VALID_RECURRENCE_TYPES.includes(type)) {
    return undefined;
  }

  const interval = asNumber(value.interval) ?? 1;
  const daysOfWeek = Array.isArray(value.daysOfWeek)
    ? value.daysOfWeek.filter((day) => typeof day === 'number' && day >= 0 && day <= 6)
    : undefined;

  return {
    type,
    interval: interval > 0 ? interval : 1,
    ...(daysOfWeek?.length ? { daysOfWeek } : {}),
  };
}

function normalizeTaskDocument(task, userId) {
  const now = Date.now();
  const subtasks = sanitizeSubtasks(task.subtasks, now);
  const status = VALID_STATUSES.includes(task.status) ? task.status : 'todo';
  const priority = VALID_PRIORITIES.includes(task.priority) ? task.priority : 'medium';
  const isRecurring = asBoolean(task.isRecurring) ?? false;
  const recurrenceRule = isRecurring ? sanitizeRecurrenceRule(task.recurrenceRule) : undefined;

  return {
    userId: asNonEmptyString(task.userId) ?? userId,
    title: asNonEmptyString(task.title) ?? 'Untitled task',
    ...(asNonEmptyString(task.description) ? { description: asNonEmptyString(task.description) } : {}),
    status,
    priority,
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
}

function taskNeedsNormalization(task, normalizedTask) {
  return JSON.stringify(task) !== JSON.stringify({ id: task.id, ...normalizedTask });
}

async function ensureGeneralListExists(db, userId) {
  const generalListRef = doc(db, `users/${userId}/taskLists`, GENERAL_LIST_ID);
  await writeBatch(db)
    .set(generalListRef, { ...GENERAL_LIST, userId, createdAt: Date.now() }, { merge: true })
    .commit();
}

async function normalizeTasksForUser(db, userId) {
  if (!userId) {
    throw new Error('Debes enviar un userId. Ejemplo: npm run normalize:tasks -- --userId=abc123');
  }

  console.log(`Normalizando tareas para el usuario: ${userId}`);
  await ensureGeneralListExists(db, userId);

  const tasksRef = collection(db, `users/${userId}/tasks`);
  const snapshot = await getDocs(tasksRef);

  if (snapshot.empty) {
    console.log('No hay tareas para normalizar.');
    return { scanned: 0, updated: 0 };
  }

  let scanned = 0;
  let updated = 0;
  let batch = writeBatch(db);
  let batchOperations = 0;

  for (const taskDoc of snapshot.docs) {
    scanned += 1;
    const currentTask = { id: taskDoc.id, ...taskDoc.data() };
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

function parseUserIdArg(argv) {
  const arg = argv.find((item) => item.startsWith('--userId='));
  if (arg) {
    return arg.slice('--userId='.length).trim();
  }

  const flagIndex = argv.findIndex((item) => item === '--userId');
  if (flagIndex !== -1) {
    return argv[flagIndex + 1]?.trim();
  }

  return undefined;
}

async function main() {
  const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
  Object.assign(process.env, env);

  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };

  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno de Firebase: ${missing.join(', ')}`);
  }

  const userId = parseUserIdArg(process.argv.slice(2));
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  await normalizeTasksForUser(db, userId);
}

main().catch((error) => {
  console.error('Error al normalizar tareas:', error);
  process.exitCode = 1;
});
