import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages: https://orellanajheremiast.github.io/Chops/
export default defineConfig({
  plugins: [react()],
  base: '/Chops/',
})
