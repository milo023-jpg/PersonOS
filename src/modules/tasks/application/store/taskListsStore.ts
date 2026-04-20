import { create } from 'zustand';
import type { TaskList } from '../../domain/models/TaskList';
import { taskListsRepository } from '../../infrastructure/repositories/taskListsRepository';

interface TaskListsState {
    lists: TaskList[];
    isLoading: boolean;
    error: string | null;

    fetchLists: (userId: string) => Promise<void>;
    createList: (userId: string, data: Omit<TaskList, 'id' | 'userId' | 'createdAt'>) => Promise<string>;
    updateList: (userId: string, listId: string, partial: Partial<TaskList>) => Promise<void>;
    deleteList: (userId: string, listId: string) => Promise<void>;
}

export const useTaskListsStore = create<TaskListsState>((set, get) => ({
    lists: [],
    isLoading: false,
    error: null,

    fetchLists: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const lists = await taskListsRepository.getLists(userId);
            set({ lists: lists.sort((a, b) => a.order - b.order) });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    createList: async (userId: string, data) => {
        try {
            const newList: Omit<TaskList, 'id'> = {
                ...data,
                userId,
                createdAt: Date.now()
            };
            const id = await taskListsRepository.createList(newList);
            set((state) => ({ lists: [...state.lists, { ...newList, id }] }));
            return id;
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    updateList: async (userId, listId, partial) => {
        const previous = get().lists;
        set((state) => ({
            lists: state.lists.map(l => l.id === listId ? { ...l, ...partial } : l)
        }));
        try {
            await taskListsRepository.updateList(userId, listId, partial);
        } catch (error: any) {
            set({ lists: previous, error: error.message });
        }
    },

    deleteList: async (userId, listId) => {
        const previous = get().lists;
        set((state) => ({
            lists: state.lists.filter(l => l.id !== listId)
        }));
        try {
            await taskListsRepository.deleteList(userId, listId);
        } catch (error: any) {
            set({ lists: previous, error: error.message });
        }
    }
}));
