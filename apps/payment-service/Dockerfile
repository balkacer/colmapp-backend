FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Copiar package.json de la raíz
COPY package*.json ./

# Instalar dependencias globales del monorepo
RUN npm install

# Copiar todo el monorepo
COPY . .

# Compilar solo el servicio necesario
RUN npm run build payment-service

FROM node:18-alpine AS production
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /usr/src/app/dist/apps/payment-service ./dist

CMD ["node", "dist/main.js"]

EXPOSE 3007