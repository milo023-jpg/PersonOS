import { create } from 'zustand';
import { contextsService } from '../../infrastructure/services/contexts.service';
import type { Context } from '../../domain/models/types';

interface ContextsState {
    contexts: Context[];
    isLoading: boolean;
    fetchContexts: (userId: string) => Promise<void>;
    createContext: (userId: string, data: Omit<Context, 'id' | 'userId'>) => Promise<void>;
}

export const useContextsStore = create<ContextsState>((set) => ({
    contexts: [],
    isLoading: false,

    fetchContexts: async (userId: string) => {
        set({ isLoading: true });
        try {
            const contexts = await contextsService.getContexts(userId);
            set({ contexts, isLoading: false });
        } catch (error) {
            console.error(error);
            set({ isLoading: false });
        }
    },

    createContext: async (userId: string, data: Omit<Context, 'id' | 'userId'>) => {
        try {
            const id = await contextsService.createContext(userId, data);
            const newContext: Context = { ...data, id, userId };
            set((state) => ({ contexts: [...state.contexts, newContext] }));
        } catch (error) {
            console.error(error);
        }
    }
}));
