import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Se corrigió el error de tipo reemplazando process.cwd() por ''
  const env = loadEnv(mode, '', '');
  return {
    define: {
      // Se expone la variable de entorno VITE_GEMINI_API_KEY (del archivo .env) 
      // como process.env.API_KEY para que el SDK de Gemini pueda acceder a ella.
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      
      '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
      '__BUILD_TIMESTAMP__': JSON.stringify(new Date().toLocaleString('es-ES')),
      '__PROJECT_ID__': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
    },
    plugins: [react()],
  }
})