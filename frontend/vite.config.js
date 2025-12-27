import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: process.env.VERCEL ? '/' : (process.env.NODE_ENV === 'production' ? '/cursorai/' : '/'),
  build: {
    outDir: 'dist'
  }
})

