import { create } from 'zustand';
import type { TaskList } from '../../domain/models/TaskList';
import { GENERAL_LIST, GENERAL_LIST_ID } from '../../domain/constants/defaults';
import { taskListsRepository } from '../../infrastructure/repositories/taskListsRepository';

interface TaskListsState {
    lists: TaskList[];
    isLoading: boolean;
    error: string | null;

    fetchLists: (userId: string) => Promise<void>;
    ensureGeneralList: (userId: string) => Promise<void>;
    createList: (userId: string, data: Omit<TaskList, 'id' | 'userId' | 'createdAt'>) => Promise<string>;
    updateList: (userId: string, listId: string, partial: Partial<TaskList>) => Promise<void>;
    deleteList: (userId: string, listId: string) => Promise<void>;
    reorderLists: (userId: string, listId: string, direction: 'up' | 'down') => Promise<void>;
    reorderListsTo: (userId: string, orderedIds: string[]) => Promise<void>;
}

export const useTaskListsStore = create<TaskListsState>((set, get) => ({
    lists: [],
    isLoading: false,
    error: null,

    ensureGeneralList: async (userId: string) => {
        const existing = get().lists.find((list) => list.id === GENERAL_LIST_ID);
        if (existing) {
            return;
        }

        await taskListsRepository.upsertList(userId, GENERAL_LIST_ID, GENERAL_LIST);
        set((state) => ({
            lists: [
                {
                    ...GENERAL_LIST,
                    id: GENERAL_LIST_ID,
                    userId,
                    createdAt: Date.now()
                },
                ...state.lists.map((list) => ({
                    ...list,
                    order: list.id === GENERAL_LIST_ID ? list.order : list.order + 1
                }))
            ]
        }));
    },

    fetchLists: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const lists = await taskListsRepository.getLists(userId);
            const generalList = lists.find((list) => list.id === GENERAL_LIST_ID);

            if (!generalList) {
                await taskListsRepository.upsertList(userId, GENERAL_LIST_ID, GENERAL_LIST);
            }

            const normalizedLists = [
                ...(generalList ? [generalList] : [{
                    ...GENERAL_LIST,
                    id: GENERAL_LIST_ID,
                    userId,
                    createdAt: Date.now()
                }]),
                ...lists.filter((list) => list.id !== GENERAL_LIST_ID)
            ].map((list, index) => ({
                ...list,
                isDefault: list.id === GENERAL_LIST_ID ? true : list.isDefault,
                // Respetar el `order` persistido por el drag & drop; el índice
                // solo funciona como fallback para documentos antiguos sin `order`.
                order: list.id === GENERAL_LIST_ID ? 0 : (typeof list.order === 'number' ? list.order : index),
            }));

            set({
                lists: normalizedLists.sort((a, b) => {
                    if (a.id === GENERAL_LIST_ID) return -1;
                    if (b.id === GENERAL_LIST_ID) return 1;
                    return (a.order - b.order) || (a.createdAt - b.createdAt);
                })
            });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    createList: async (userId: string, data) => {
        try {
            // Siguiente índice tras el máximo actual para no colisionar órdenes.
            const nextOrder = Math.max(1, ...get().lists.map((list) => list.order)) + 1;
            const newList: Omit<TaskList, 'id'> = {
                ...data,
                userId,
                createdAt: Date.now(),
                order: nextOrder
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
        if (listId === GENERAL_LIST_ID) {
            return;
        }
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
        if (listId === GENERAL_LIST_ID) {
            return;
        }
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
        const previousLists = get().lists;
        const currentIndex = previousLists.findIndex(l => l.id === listId);
        if (currentIndex === -1) return;
        if (listId === GENERAL_LIST_ID) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 1 || newIndex >= previousLists.length) return;

        const moved = [...previousLists];
        [moved[currentIndex], moved[newIndex]] = [moved[newIndex], moved[currentIndex]];

        // Renumerar el orden completo 0..n sin mutar los objetos originales.
        const renumbered = moved.map((list, index) => ({ ...list, order: index }));

        set({ lists: renumbered });

        // Persistir el orden 0..n completo en Firestore (patrón optimista + rollback).
        // Se usa el repositorio directo y no `updateList` porque éste omite la
        // lista general, que también debe persistir su orden (siempre 0).
        try {
            await Promise.all(
                renumbered.map(list => taskListsRepository.updateList(userId, list.id, { order: list.order }))
            );
        } catch (error: any) {
            set({ lists: previousLists, error: error.message });
        }
    },

    reorderListsTo: async (userId, orderedIds) => {
        const previousLists = get().lists;

        // Renumerar 0..n: la lista general se queda en 0 y el resto sigue el
        // orden recibido (1..n). Se reemplaza el array completo (optimista).
        const renumbered = previousLists.map((list) => {
            if (list.id === GENERAL_LIST_ID) {
                return { ...list, order: 0 };
            }
            const position = orderedIds.indexOf(list.id);
            return position === -1 ? list : { ...list, order: position + 1 };
        });

        set({ lists: renumbered });

        // Persistir el orden completo en Firestore (patrón optimista + rollback).
        try {
            await Promise.all(
                renumbered.map(list => taskListsRepository.updateList(userId, list.id, { order: list.order }))
            );
        } catch (error: any) {
            set({ lists: previousLists, error: error.message });
        }
    }
}));
