import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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

// TODO: (Ejercicio) Crear un Wrapper Pattern en la base de datos
export const db = getFirestore(app);

// En WebView nativo (Capacitor) se usa persistencia IndexedDB para que la sesión
// sobreviva al cierre y reapertura de la app. En web se conserva el
// comportamiento por defecto (localStorage).
export const auth = Capacitor.isNativePlatform()
    ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
    : getAuth(app);