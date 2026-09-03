import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, indexedDBLocalPersistence, initializeAuth } from "firebase/auth";
import { Capacitor } from "@capacitor/core";

// IMPORTANTE: Nunca subir credenciales hardcodeadas al repositorio.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// Se usa persistencia local (IndexedDB) para permitir el modo offline:
// los documentos leídos se guardan en el dispositivo y las escrituras se
// encolan y sincronizan cuando vuelve la conexión. Esto funciona tanto en la
// WebView de Capacitor como en el navegador (PWA).
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// En WebView nativo (Capacitor) se usa persistencia IndexedDB para que la sesión
// sobreviva al cierre y reapertura de la app. En web se conserva el
// comportamiento por defecto (localStorage).
export const auth = Capacitor.isNativePlatform()
    ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
    : getAuth(app);