import { defineConfig } from 'vite'
importWK react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/WishesWall/",  // <--- THIS IS THE MISSING MAGIC LINE
  server: {
    host: true
  }
})
