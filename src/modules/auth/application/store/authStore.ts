import { create } from 'zustand';
import { type User } from 'firebase/auth';
import {
  observeAuthState,
  signInWithEmailPassword,
  signInWithGoogle,
  signOutUser,
  signUpWithEmailPassword,
} from '../../infrastructure/auth.service';

interface AuthState {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDevSession: boolean;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  initializeAuthListener: () => () => void;
  clearError: () => void;
  loginAsDevUser: (uid?: string) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  registerWithEmailPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

let hasInitializedListener = false;
let authUnsubscribe: (() => void) | null = null;

function getFirebaseErrorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return 'No se pudo completar la autenticacion. Intenta de nuevo.';
  }

  const code = String(error.code);
  const errorMap: Record<string, string> = {
    'auth/invalid-credential': 'Correo o contrasena invalida.',
    'auth/invalid-email': 'El correo no tiene un formato valido.',
    'auth/missing-password': 'Debes escribir una contrasena.',
    'auth/weak-password': 'La contrasena debe tener al menos 6 caracteres.',
    'auth/email-already-in-use': 'Este correo ya esta registrado.',
    'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de completar el acceso.',
    'auth/cancelled-popup-request': 'Se cancelo la solicitud de acceso con Google.',
    'auth/network-request-failed': 'Error de red. Revisa tu conexion e intenta nuevamente.',
  };

  return errorMap[code] ?? 'No se pudo completar la autenticacion. Intenta de nuevo.';
}

function applyUser(set: (partial: Partial<AuthState>) => void, user: User | null) {
  set({
    userId: user?.uid ?? null,
    email: user?.email ?? null,
    displayName: user?.displayName ?? null,
    photoURL: user?.photoURL ?? null,
    isDevSession: false,
    isReady: true,
    isLoading: false,
    error: null,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  email: null,
  displayName: null,
  photoURL: null,
  isDevSession: false,
  isReady: false,
  isLoading: false,
  error: null,

  initializeAuthListener: () => {
    if (hasInitializedListener && authUnsubscribe) {
      return authUnsubscribe;
    }

    hasInitializedListener = true;
    set({ isReady: false });
    authUnsubscribe = observeAuthState((user) => {
      if (!user && get().isDevSession) {
        set({ isReady: true, isLoading: false });
        return;
      }

      applyUser(set, user);
    });

    return authUnsubscribe;
  },

  clearError: () => set({ error: null }),

  loginAsDevUser: (uid = 'dev-user-001') => {
    if (!import.meta.env.DEV) {
      return;
    }

    set({
      userId: uid,
      email: `${uid}@local.dev`,
      displayName: 'Usuario de pruebas',
      photoURL: null,
      isDevSession: true,
      isReady: true,
      isLoading: false,
      error: null,
    });
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      await signInWithGoogle();
    } catch (error) {
      set({ isLoading: false, error: getFirebaseErrorMessage(error) });
      throw error;
    }
  },

  loginWithEmailPassword: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await signInWithEmailPassword(email, password);
    } catch (error) {
      set({ isLoading: false, error: getFirebaseErrorMessage(error) });
      throw error;
    }
  },

  registerWithEmailPassword: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await signUpWithEmailPassword(email, password);
    } catch (error) {
      set({ isLoading: false, error: getFirebaseErrorMessage(error) });
      throw error;
    }
  },

  logout: async () => {
    if (get().isDevSession) {
      set({
        userId: null,
        email: null,
        displayName: null,
        photoURL: null,
        isDevSession: false,
        isReady: true,
        isLoading: false,
        error: null,
      });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      await signOutUser();
    } catch (error) {
      set({ isLoading: false, error: getFirebaseErrorMessage(error) });
      throw error;
    }
  },
}));
