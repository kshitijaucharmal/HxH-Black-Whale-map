import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Data lives in /data at the repo root (outside /src) so it reads as plain
// content and is easy for contributors to edit. Allow Vite to serve it.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    fs: { allow: ['..'] },
  },
})
