import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '../../../services/firebase';
import { platformService } from '../../../services/platform/PlatformService';

const googleProvider = new GoogleAuthProvider();

export function observeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Web/PWA: popup estándar de Firebase. Android (Capacitor): el popup no es
// fiable dentro del WebView, así que se usa Google Sign-In nativo del plugin
// y se completa la sesión en el Firebase JS SDK con signInWithCredential.
export function signInWithGoogle(): Promise<UserCredential> {
  if (!platformService.isNative()) {
    return signInWithPopup(auth, googleProvider);
  }
  return signInNativeWithGoogle();
}

async function signInNativeWithGoogle(): Promise<UserCredential> {
  const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
  const result = await FirebaseAuthentication.signInWithGoogle();
  const idToken = result.credential?.idToken;
  if (!idToken) {
    throw new Error('Google Sign-In no devolvió un ID token de autenticación.');
  }
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

export function signInWithEmailPassword(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signUpWithEmailPassword(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signInAnonymouslyDev(): Promise<UserCredential> {
  return signInAnonymously(auth);
}

export async function signOutUser(): Promise<void> {
  if (platformService.isNative()) {
    try {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      await FirebaseAuthentication.signOut();
    } catch {
      // Sin sesión nativa activa: se ignora y se procede con el cierre en el JS SDK.
    }
  }
  return signOut(auth);
}
