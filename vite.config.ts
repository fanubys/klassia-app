import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
    '__BUILD_TIMESTAMP__': JSON.stringify(new Date().toLocaleString('es-ES')),
  },
  plugins: [react()],
})
