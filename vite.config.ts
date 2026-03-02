import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    // Inyectamos process.env.GEMINI_API_KEY para cumplir con los requisitos del SDK de Google GenAI
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || '')
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    allowedHosts: ['comitetierraesperanza.com', 'www.comitetierraesperanza.com']
  }
});
