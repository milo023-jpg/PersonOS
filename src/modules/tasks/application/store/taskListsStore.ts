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
    reorderLists: (userId: string, listId: string, direction: 'up' | 'down') => Promise<void>;
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
    },

    reorderLists: async (userId, listId, direction) => {
        const lists = get().lists;
        const currentIndex = lists.findIndex(l => l.id === listId);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= lists.length) return;

        const newLists = [...lists];
        [newLists[currentIndex], newLists[newIndex]] = [newLists[newIndex], newLists[currentIndex]];

        // Update orders
        newLists.forEach((list, index) => {
            list.order = index;
        });

        set({ lists: newLists });

        // Persist the changes
        try {
            await Promise.all(newLists.map(list => taskListsRepository.updateList(userId, list.id, { order: list.order })));
        } catch (error: any) {
            // Revert on error
            set({ lists: lists, error: error.message });
        }
    }
}));
