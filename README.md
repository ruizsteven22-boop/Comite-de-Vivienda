# 🌳 Tierra Esperanza - Gestión de Comité

Plataforma integral para la administración de comités de vivienda.

## 🚀 Despliegue en Hostinger (recomendado: Hosting estático)

Este proyecto usa **React + Vite**. En Hostinger compartido (sin Node.js), se debe publicar la carpeta `dist`.

### 1) Compilar para producción

```bash
npm install
npm run build
```

Esto genera la carpeta `dist/` con los archivos listos para producción.

### 2) Subir archivos correctos

Sube **solo el contenido de `dist/`** a `public_html/` (o a la carpeta del dominio).

Archivos importantes:
- `index.html`
- `assets/*`
- `.htaccess` (incluido en este repositorio para evitar 404 en rutas SPA)

### 3) Comportamiento de datos en Hostinger

- Si existe backend Node con `/api`, la app usa modo servidor.
- Si no existe `/api` (caso típico en hosting estático), la app cambia automáticamente a **modo local** y guarda los datos en `localStorage` del navegador.
- Usuario/clave por defecto en modo local: los usuarios existentes usan contraseña `te2024` si no tienen una definida.

## 🧪 Validación local

```bash
npm run lint
npm run build
```

## 🔑 Nota de seguridad

Si vas a operar con múltiples usuarios y respaldo centralizado, usa un servidor Node (VPS) para la API `/api` y evita depender solo de `localStorage`.
