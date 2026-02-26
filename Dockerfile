# Dockerfile para Aplicación Full-Stack (Node.js + Vite)
FROM node:20-alpine
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar código y construir frontend
COPY . .
RUN npm run build

# Limpiar dependencias de desarrollo para reducir tamaño
RUN npm prune --omit=dev

# Exponer el puerto 3000 (puerto por defecto del servidor Express)
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar el servidor
CMD ["npm", "start"]
