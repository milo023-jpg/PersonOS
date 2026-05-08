import { create } from 'zustand';
import { type User } from 'firebase/auth';
import {
  observeAuthState,
  signInAnonymouslyDev,
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
  loginAsDevUser: (uid?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  registerWithEmailPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const DEV_SESSION_KEY = 'personal-os:dev-session';

function getPersistedDevSession(): { userId: string; email: string } | null {
  try {
    const raw = localStorage.getItem(DEV_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === 'string') {
      return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

function persistDevSession(userId: string, email: string) {
  localStorage.setItem(DEV_SESSION_KEY, JSON.stringify({ userId, email }));
}

function clearDevSession() {
  localStorage.removeItem(DEV_SESSION_KEY);
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

    // 1. Try to restore dev session from localStorage FIRST
    const persistedDev = getPersistedDevSession();
    if (persistedDev) {
      // Restore dev session immediately without waiting for Firebase
      set({
        userId: persistedDev.userId,
        email: persistedDev.email,
        displayName: 'Usuario de pruebas',
        photoURL: null,
        isDevSession: true,
        isReady: true,
        isLoading: false,
        error: null,
      });

      // Re-authenticate anonymously in background so Firestore rules still work
      signInAnonymouslyDev().catch(() => {
        // Silently ignore — Firestore may still work with cached auth or permissive rules in dev
      });

      // We still register the listener to catch real auth changes (e.g. if user logs out elsewhere)
      authUnsubscribe = observeAuthState((user) => {
        // If dev session is active, ignore Firebase auth state changes
        if (get().isDevSession) {
          return;
        }
        applyUser(set, user);
      });

      return authUnsubscribe;
    }

    // 2. Normal Firebase auth flow for non-dev users
    authUnsubscribe = observeAuthState((user) => {
      if (get().isDevSession) {
        // Should not happen without persisted session, but guard anyway
        return;
      }
      applyUser(set, user);
    });

    return authUnsubscribe;
  },

  clearError: () => set({ error: null }),

  loginAsDevUser: async (uid = 'dev-use-001') => {
    if (!import.meta.env.DEV) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await signInAnonymouslyDev();

      const email = `${uid}@local.dev`;
      persistDevSession(uid, email);

      set({
        userId: uid,
        email,
        displayName: 'Usuario de pruebas',
        photoURL: null,
        isDevSession: true,
        isReady: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isReady: true,
        isLoading: false,
        error: 'No se pudo iniciar sesion como usuario de pruebas.',
      });
    }
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
      try {
        await signOutUser();
      } catch {
        // Ignorar errores al cerrar sesion anonima
      }
      clearDevSession();
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
