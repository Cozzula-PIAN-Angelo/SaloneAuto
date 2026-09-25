import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In sviluppo /api e /uploads vanno al backend Spring (porta 8080):
// stessa origine per il browser, quindi niente CORS da configurare.
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': BACKEND,
      '/uploads': BACKEND,
    },
  },
})
