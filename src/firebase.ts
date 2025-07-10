import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, FirestoreError } from "firebase/firestore";

// --- Configuration Check ---
// We check if the essential configuration is available from environment variables.
export const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
export const firebaseConfigError = !isFirebaseConfigured 
    ? "CONFIGURACIÓN DE FIREBASE INCOMPLETA: La variable de entorno 'VITE_FIREBASE_PROJECT_ID' no fue encontrada. " +
      "Por favor, asegúrate de que tu archivo .env (o .env.local) contenga todas las claves de configuración de Firebase."
    : null;

// Your web app's Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase only if configuration is valid
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

// Get a Firestore instance, or null if not configured
export const db = app ? getFirestore(app) : null;

// Enable offline persistence if Firestore was initialized
if (db) {
    enableIndexedDbPersistence(db)
      .catch((err: FirestoreError) => {
        if (err.code === 'failed-precondition') {
          console.warn(
              "Persistencia de Firestore falló: Múltiples pestañas abiertas. La persistencia offline " +
              "solo se puede habilitar en una pestaña a la vez."
          );
        } else if (err.code === 'unimplemented') {
          console.warn(
              "Persistencia de Firestore falló: El navegador actual no soporta esta característica."
          );
        }
      });
}
