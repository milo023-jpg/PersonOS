import { create } from 'zustand';
import type { Task, TaskStatus } from '../../domain/models/Task';
import { taskRepository } from '../../infrastructure/repositories/taskRepository';

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
    toggleTaskImportance: (userId: string, taskId: string) => Promise<void>;
    moveTaskStatus: (userId: string, taskId: string, newStatus: TaskStatus) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
    tasks: [],
    isLoading: false,
    error: null,

    fetchTasks: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const tasks = await taskRepository.getTasks(userId);
            set({ tasks });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    addTask: async (taskData) => {
        set({ isLoading: true, error: null });
        try {
            const id = await taskRepository.createTask(taskData);
            set((state) => ({ tasks: [{ ...taskData, id }, ...state.tasks] }));
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
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...partial, updatedAt: Date.now() } : t)
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
                return match ? { ...task, ...match.partial, updatedAt: timestamp } : task;
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

    toggleTaskImportance: async (userId, taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (task) {
            await get().updateTask(userId, taskId, { isImportant: !task.isImportant });
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
    }
}));
