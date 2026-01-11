
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos desde la raíz
app.use(express.static(__dirname));

// Asegurar que todas las rutas carguen el index.html (soporte SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor Tierra Esperanza corriendo en el puerto ${PORT}`);
});
