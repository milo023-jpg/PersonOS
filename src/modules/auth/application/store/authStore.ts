import { create } from 'zustand';

interface AuthState {
    userId: string | null;
    isReady: boolean;
    login: (uid: string) => void;
    logout: () => void;
}

// Store simple para proveer el usuario autenticado.
// TODO: En el futuro conectar con onAuthStateChanged de Firebase.
export const useAuthStore = create<AuthState>((set) => ({
    userId: import.meta.env.DEV ? import.meta.env.VITE_DEV_USER_ID ?? null : null,
    isReady: true,
    login: (uid) => set({ userId: uid, isReady: true }),
    logout: () => set({ userId: null, isReady: true }),
}));
