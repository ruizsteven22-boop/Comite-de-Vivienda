
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Servir todos los archivos del directorio raíz
app.use(express.static(__dirname));

// Manejar cualquier ruta devolviendo el index.html (Soporte SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`--------------------------------------------------`);
  console.log(`🚀 Tierra Esperanza en línea`);
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🛠️ Modo: Producción`);
  console.log(`--------------------------------------------------`);
});
