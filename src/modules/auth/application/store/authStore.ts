import { create } from 'zustand';

interface AuthState {
    userId: string | null;
    login: (uid: string) => void;
    logout: () => void;
}

// Store simple para proveer el usuario autenticado.
// TODO: En el futuro conectar con onAuthStateChanged de Firebase.
export const useAuthStore = create<AuthState>((set) => ({
    userId: 'dev-user-001', // HARDCODED DEVELOPMENT USER para propósitos de la Fase 2
    login: (uid) => set({ userId: uid }),
    logout: () => set({ userId: null }),
}));
