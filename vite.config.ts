import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
 base: '/',
 plugins: [react(), tailwindcss()],
 define: {
 'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || '')
 },
 build: {
 outDir: 'dist',
 emptyOutDir: true,
 },
 server: {
  allowedHosts: true,
 },
});
