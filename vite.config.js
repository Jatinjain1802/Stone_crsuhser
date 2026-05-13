// vite.config.js
// ---------------------------------------------------------------
// Vite is our build tool for React. It compiles JSX → JS, bundles
// all files, and runs a dev server. In Electron, Vite serves the
// React app which Electron loads in its BrowserWindow.
// ---------------------------------------------------------------

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),       // Transforms JSX syntax
    tailwindcss(), // Applies Tailwind CSS classes
  ],
  
  // Path alias: "@" maps to "src/" folder
  // So instead of '../../components/Button', we write '@/components/Button'
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // When running inside Electron, we need paths to be relative
  // "base: './" makes all asset paths relative instead of absolute
  base: './',
  
  build: {
    outDir: 'dist',      // Output folder for production build
    emptyOutDir: true,   // Clear dist/ before each build
  },
  
  server: {
    port: 5173,          // Dev server port
  },
})
