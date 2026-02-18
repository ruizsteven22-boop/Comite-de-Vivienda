
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Prioridad al puerto de entorno para evitar errores en Cloud Run / Heroku / Netlify
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos del directorio dist (build de producción)
app.use(express.static(path.join(__dirname, 'dist')));

// Soporte para Single Page Application (SPA): Redirigir todas las rutas a index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Forzar la escucha en 0.0.0.0 para compatibilidad con contenedores
app.listen(PORT, '0.0.0.0', () => {
  console.log(`--------------------------------------------------`);
  console.log(`🚀 Tierra Esperanza Server Activo`);
  console.log(`📍 Escuchando en el puerto: ${PORT}`);
  console.log(`🖥️  Acceso: http://localhost:${PORT}`);
  console.log(`--------------------------------------------------`);
});
