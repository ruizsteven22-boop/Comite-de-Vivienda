
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Servir todos los archivos del directorio raíz
app.use(express.static(path.join(__dirname)));

// Manejar cualquier ruta devolviendo el index.html (Soporte SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`--------------------------------------------------`);
  console.log(`🚀 Tierra Esperanza en línea`);
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🛠️ Modo: Producción`);
  console.log(`--------------------------------------------------`);
});
