import { create } from 'zustand';
import { dbService } from '../../../../services/dbService';
import type { NoteList } from '../../domain/models/NoteList';
import { logger } from '../../../../shared/utils/logger';

const COLLECTION_PATH = (userId: string) => `users/${userId}/noteLists`;

interface NoteListsState {
  lists: NoteList[];
  isLoading: boolean;
  error: string | null;

  fetchLists: (userId: string) => Promise<void>;
  createList: (userId: string, data: Omit<NoteList, 'id' | 'userId' | 'createdAt'>) => Promise<string>;
  updateList: (userId: string, listId: string, partial: Partial<NoteList>) => Promise<void>;
  deleteList: (userId: string, listId: string) => Promise<void>;
  reorderLists: (userId: string, listId: string, direction: 'up' | 'down') => Promise<void>;
}

export const useNoteListsStore = create<NoteListsState>((set, get) => ({
  lists: [],
  isLoading: false,
  error: null,

  fetchLists: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const lists = await dbService.getCollectionDocuments<NoteList>(COLLECTION_PATH(userId));
      set({ lists: lists.sort((a, b) => a.order - b.order), isLoading: false });
    } catch (error: any) {
      logger.error('Failed to fetch note lists.', error);
      set({ error: error.message, isLoading: false });
    }
  },

  createList: async (userId: string, data) => {
    try {
      const newList: Omit<NoteList, 'id'> = {
        ...data,
        userId,
        createdAt: Date.now(),
        order: get().lists.length + 1,
      };
      const id = await dbService.addDocument(COLLECTION_PATH(userId), newList);
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
      await dbService.updateDocument(COLLECTION_PATH(userId), listId, partial);
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
      await dbService.deleteDocument(COLLECTION_PATH(userId), listId);
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

    newLists.forEach((list, index) => {
      list.order = index;
    });

    set({ lists: newLists });

    try {
      await Promise.all(newLists.map(list => dbService.updateDocument(COLLECTION_PATH(userId), list.id, { order: list.order })));
    } catch (error: any) {
      set({ lists: lists, error: error.message });
    }
  },
}));
