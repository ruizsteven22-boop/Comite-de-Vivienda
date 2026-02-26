FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
# Copiamos el build del frontend
COPY --from=build /app/dist ./dist
# IMPORTANTE: Copiamos los archivos del servidor necesarios para 'npm start'
COPY server/ ./server
# También copiamos tsconfig.json si es necesario para tsx (opcional pero recomendado)
COPY tsconfig.json ./ 

EXPOSE 3000
CMD ["npm", "start"]
