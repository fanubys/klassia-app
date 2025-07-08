// The reference to "vite/client" was causing an error.
// The types for import.meta.env and process.env are now defined manually.

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
declare const __BUILD_TIMESTAMP__: string;

// Declare process to be available for the Gemini API Key, as per usage guidelines.
// Vite is expected to replace this at build time.
// We augment the global NodeJS namespace to avoid redeclaration errors.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}