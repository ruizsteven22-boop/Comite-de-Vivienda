
# 🌳 Tierra Esperanza - Gestión de Comité

Plataforma integral para la administración de comités de vivienda.

## 🚀 Guía de Despliegue (Hosting Estático / cPanel)

Si vas a subir este proyecto a un hosting como **Hostinger, Bluehost, Namecheap o cPanel**, sigue estos pasos:

1.  **Prepara los archivos**: Asegúrate de tener todos los archivos en la raíz de tu proyecto.
2.  **Sube por FTP o Administrador de Archivos**:
    *   Entra al Administrador de Archivos de tu hosting.
    *   Navega hasta la carpeta `public_html` (o la carpeta de tu dominio).
    *   Sube **todos** los archivos directamente allí.
3.  **Verifica los Archivos Clave**:
    *   `.htaccess`: Es vital para que las rutas no den error 404.
    *   `index.html`: El punto de entrada.
    *   `index.tsx` y carpetas `components/`, `services/`: Deben mantener su estructura.
4.  **Configura la API KEY**:
    *   Si tu hosting permite variables de entorno (como Vercel o Netlify), añade `API_KEY`.
    *   Si es un hosting estático simple, el sistema buscará `process.env.API_KEY`. En entornos sin servidor, deberás asegurarte de que la clave esté disponible o configurar un proxy si deseas ocultarla.

## 🛠️ Notas Técnicas
- La aplicación utiliza **ESM (ES Modules)**, por lo que no requiere compilación previa (Build step). El navegador descarga y ejecuta los archivos directamente.
- Los datos se guardan en el **LocalStorage** del navegador del usuario, por lo que son persistentes en ese equipo.

## 🔑 Soporte
Para cambios profundos en la lógica, contactar al administrador del sistema.
