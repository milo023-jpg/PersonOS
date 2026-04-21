import { create } from 'zustand';
import type { Subtask, Task, TaskStatus } from '../../domain/models/Task';
import { GENERAL_LIST_ID } from '../../domain/constants/defaults';
import { taskRepository } from '../../infrastructure/repositories/taskRepository';

function normalizeTask(task: Task): Task {
    return {
        ...task,
        listId: task.listId || GENERAL_LIST_ID,
        source: task.source || 'manual',
        subtasks: task.subtasks ?? [],
    };
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
        set((state) => ({
            tasks: state.tasks.map(t => t.id === taskId ? normalizeTask({ ...t, ...partial, updatedAt: Date.now() } as Task) : t)
        }));
        
        try {
            await taskRepository.updateTask(userId, taskId, { ...partial, updatedAt: Date.now() });
        } catch (error: any) {
            set({ tasks: previousTasks, error: error.message }); // Rollback
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

        const updatedSubtasks = [...(task.subtasks ?? []), newSubtask];
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
