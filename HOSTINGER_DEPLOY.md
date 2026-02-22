# Guía de Despliegue en Hostinger

Para subir esta aplicación a Hostinger, sigue estos pasos:

## 1. Preparación Local
Antes de subir los archivos, asegúrate de generar la versión de producción del frontend:
```bash
npm run build
```
Esto creará la carpeta `dist/`.

## 2. Subir Archivos
Sube todos los archivos de la raíz del proyecto a tu servidor Hostinger (vía Administrador de Archivos o FTP), **EXCEPTO** la carpeta `node_modules/`.

Archivos indispensables:
- `dist/` (Generado en el paso 1)
- `server.ts`
- `db.ts`
- `package.json`
- `tsconfig.json`
- `data.json` (Tu base de datos actual)

## 3. Configuración en Hostinger (Panel de Control)
1. Ve a la sección **Node.js** en tu panel de Hostinger.
2. Crea una nueva aplicación:
   - **App Directory**: La carpeta donde subiste los archivos.
   - **App Domain**: Tu dominio o subdominio.
   - **App Entry Point**: `server.ts`
   - **Node.js Version**: Selecciona 20.x o superior.
3. Haz clic en **Install Dependencies** (esto ejecutará `npm install` en el servidor).

## 4. Variables de Entorno
En la configuración de la aplicación Node.js en Hostinger, añade las siguientes variables:
- `NODE_ENV`: `production`
- `GEMINI_API_KEY`: Tu clave de API de Google Gemini.

## 5. Ejecución
Una vez instaladas las dependencias, inicia la aplicación. Hostinger detectará automáticamente el script `start` de tu `package.json`.

---
**Nota sobre la Base de Datos:**
El archivo `data.json` actúa como tu base de datos. Si Hostinger reinicia el contenedor, asegúrate de que los cambios se guarden en este archivo persistente. En planes VPS, se recomienda usar PM2 (ya configurado en `ecosystem.config.cjs`).
