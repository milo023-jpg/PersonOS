import { create } from 'zustand';
import type { Subtask, Task, TaskStatus } from '../../domain/models/Task';
import { GENERAL_LIST_ID } from '../../domain/constants/defaults';
import { taskRepository } from '../../infrastructure/repositories/taskRepository';
import { dbService } from '../../../../services/dbService';
import { normalizeTaskDocument, sanitizeSubtasks, type TaskDocument } from '../../../../scripts/normalizeTasks';
import { logger } from '../../../../shared/utils/logger';

function normalizeTask(task: Task): Task {
    return {
        ...task,
        listId: task.listId || GENERAL_LIST_ID,
        source: task.source || 'manual',
        subtasks: task.subtasks ?? [],
        isImportant: task.isImportant ?? false,
    };
}

function buildTaskDebugSnapshot(task: Task | undefined) {
    if (!task) return null;

    return {
        id: task.id,
        title: task.title,
        status: task.status,
        listId: task.listId,
        source: task.source,
        updatedAt: task.updatedAt,
        subtasksCount: Array.isArray(task.subtasks) ? task.subtasks.length : 'invalid',
        documentIdMatchesFieldId: task.id === (task as TaskDocument).id,
    };
}

function sanitizeSubtasksForPersistence(subtasks: unknown): Subtask[] {
    return sanitizeSubtasks(subtasks, Date.now()).map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        completed: subtask.completed,
        createdAt: subtask.createdAt,
    }));
}

function buildUserFacingError(action: 'update' | 'subtask', task: Task | undefined, error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const taskLabel = task?.title ? `"${task.title}"` : 'la tarea';
    const lower = message.toLowerCase();

    if (lower.includes('permission') || lower.includes('missing or insufficient permissions')) {
        return `No se pudo guardar el cambio en ${taskLabel} por permisos de Firestore. Revisa las reglas o el usuario actual.`;
    }

    if (action === 'subtask') {
        return `No se pudo guardar la subtarea en ${taskLabel}. La app restauró el estado anterior para evitar datos inconsistentes.`;
    }

    return `No se pudo actualizar ${taskLabel}. Intenta de nuevo y revisa la consola para más detalle.`;
}

async function repairTaskDocument(userId: string, taskId: string) {
    const collectionPath = `users/${userId}/tasks`;
    const rawTask = await dbService.getDocument<TaskDocument>(collectionPath, taskId);
    if (!rawTask) {
        return null;
    }

    const normalizedTask = normalizeTaskDocument(rawTask, userId);
    await dbService.createDocument(collectionPath, taskId, { id: taskId, ...normalizedTask });
    return { id: taskId, ...normalizedTask } as Task;
}

interface TasksState {
    tasks: Task[];
    isLoading: boolean;
    error: string | null;

    // Conexión Firebase Real
    fetchTasks: (userId: string) => Promise<void>;
    addTask: (taskData: Omit<Task, 'id'>) => Promise<string>;
    updateTask: (userId: string, taskId: string, partial: Partial<Task>) => Promise<void>;
    updateTasksBulk: (userId: string, updates: Array<{ taskId: string; partial: Partial<Task> }>) => Promise<void>;
    deleteTask: (userId: string, taskId: string) => Promise<void>;
    clearError: () => void;
    
    // Acciones de conveniencia (usan updateTask internamente)
    moveTaskStatus: (userId: string, taskId: string, newStatus: TaskStatus) => Promise<void>;

    // Subtareas
    addSubtask: (userId: string, taskId: string, title: string) => Promise<void>;
    toggleSubtask: (userId: string, taskId: string, subtaskId: string) => Promise<void>;
    editSubtask: (userId: string, taskId: string, subtaskId: string, newTitle: string) => Promise<void>;
    deleteSubtask: (userId: string, taskId: string, subtaskId: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
    tasks: [],
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    fetchTasks: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const tasks = await taskRepository.getTasks(userId);
            const migratedTasks = tasks.map((task) => normalizeTask(task));

            const missingListTasks = tasks.filter((task) => !task.listId);
            if (missingListTasks.length > 0) {
                await Promise.all(
                    missingListTasks.map((task) =>
                        taskRepository.updateTask(userId, task.id, { listId: GENERAL_LIST_ID })
                    )
                );
            }

            set({ tasks: migratedTasks });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    addTask: async (taskData) => {
        set({ isLoading: true, error: null });
        try {
            const normalizedTask = normalizeTask(taskData as Task);
            const id = await taskRepository.createTask(normalizedTask);
            set((state) => ({ tasks: [{ ...normalizedTask, id }, ...state.tasks] }));
            return id;
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateTask: async (userId, taskId, partial) => {
        // Optimistic update
        const previousTasks = get().tasks;
        const currentTask = previousTasks.find((t) => t.id === taskId);
        const sanitizedPartial: Partial<Task> = {
            ...partial,
            ...(Object.prototype.hasOwnProperty.call(partial, 'subtasks')
                ? { subtasks: sanitizeSubtasksForPersistence(partial.subtasks) }
                : {})
        };
        const timestamp = Date.now();
        set((state) => ({
            tasks: state.tasks.map(t => t.id === taskId ? normalizeTask({ ...t, ...sanitizedPartial, updatedAt: timestamp } as Task) : t)
        }));
        
        try {
            await taskRepository.updateTask(userId, taskId, { ...sanitizedPartial, updatedAt: timestamp });
        } catch (error: any) {
            logger.error('Task update failed, attempting diagnosis.', error, {
                taskId,
                payload: sanitizedPartial,
                previousTask: buildTaskDebugSnapshot(currentTask),
            });

            if (Object.prototype.hasOwnProperty.call(sanitizedPartial, 'subtasks')) {
                try {
                    const repairedTask = await repairTaskDocument(userId, taskId);
                    const retriedPartial = { ...sanitizedPartial, updatedAt: Date.now() };

                    await taskRepository.updateTask(userId, taskId, retriedPartial);
                    set((state) => ({
                        tasks: state.tasks.map((task) =>
                            task.id === taskId
                                ? normalizeTask({
                                    ...(repairedTask ?? task),
                                    ...retriedPartial,
                                } as Task)
                                : task
                        ),
                        error: null,
                    }));
                    return;
                } catch (retryError: any) {
                    logger.error('Task self-healing retry failed.', retryError, {
                        taskId,
                        payload: sanitizedPartial,
                        previousTask: buildTaskDebugSnapshot(currentTask),
                    });
                    set({
                        tasks: previousTasks,
                        error: buildUserFacingError('subtask', currentTask, retryError),
                    });
                    return;
                }
            }

            set({
                tasks: previousTasks,
                error: buildUserFacingError('update', currentTask, error),
            }); // Rollback
        }
    },

    deleteTask: async (userId, taskId) => {
        const previousTasks = get().tasks;
        set((state) => ({
            tasks: state.tasks.filter(t => t.id !== taskId)
        }));

        try {
            await taskRepository.deleteTask(userId, taskId);
        } catch (error: any) {
            set({ tasks: previousTasks, error: error.message }); // Rollback
        }
    },

    updateTasksBulk: async (userId, updates) => {
        if (updates.length === 0) return;

        const previousTasks = get().tasks;
        const timestamp = Date.now();

        set((state) => ({
            tasks: state.tasks.map((task) => {
                const match = updates.find((update) => update.taskId === task.id);
                return match ? normalizeTask({ ...task, ...match.partial, updatedAt: timestamp } as Task) : task;
            })
        }));

        try {
            await Promise.all(
                updates.map(({ taskId, partial }) =>
                    taskRepository.updateTask(userId, taskId, { ...partial, updatedAt: timestamp })
                )
            );
        } catch (error: any) {
            set({ tasks: previousTasks, error: error.message });
        }
    },

    moveTaskStatus: async (userId, taskId, newStatus) => {
        const payload: Partial<Task> = { status: newStatus };
        if (newStatus === 'completed') {
            payload.completedAt = Date.now();
        } else {
            payload.completedAt = null as any; 
        }
        await get().updateTask(userId, taskId, payload);
    },

    addSubtask: async (userId, taskId, title) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;

        const newSubtask: Subtask = {
            id: crypto.randomUUID(),
            title: title.trim(),
            completed: false,
            createdAt: Date.now(),
        };

        const updatedSubtasks = sanitizeSubtasksForPersistence([...(task.subtasks ?? []), newSubtask]);
        logger.info('Adding subtask to task.', {
            taskId,
            payload: updatedSubtasks,
            previousTask: buildTaskDebugSnapshot(task),
        });
        await get().updateTask(userId, taskId, { subtasks: updatedSubtasks });
    },

    toggleSubtask: async (userId, taskId, subtaskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;

        const updatedSubtasks = (task.subtasks ?? []).map(s =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );

        const partial: Partial<Task> = { subtasks: updatedSubtasks };

        // Auto-completar la tarea padre si todas las subtareas están completas
        const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.completed);
        if (allCompleted && task.status !== 'completed') {
            partial.status = 'completed';
            partial.completedAt = Date.now();
        }

        await get().updateTask(userId, taskId, partial);
    },

    editSubtask: async (userId, taskId, subtaskId, newTitle) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;

        const updatedSubtasks = (task.subtasks ?? []).map(s =>
            s.id === subtaskId ? { ...s, title: newTitle.trim() } : s
        );

        await get().updateTask(userId, taskId, { subtasks: updatedSubtasks });
    },

    deleteSubtask: async (userId, taskId, subtaskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;

        const updatedSubtasks = (task.subtasks ?? []).filter(s => s.id !== subtaskId);
        await get().updateTask(userId, taskId, { subtasks: updatedSubtasks });
    },
}));
