
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos desde la carpeta de salida del build
app.use(express.static(path.join(__dirname, 'public')));

// Asegurar que todas las rutas carguen el index.html (soporte SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor Tierra Esperanza corriendo en el puerto ${PORT}`);
});
