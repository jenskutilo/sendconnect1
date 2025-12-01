FROM node:18-alpine

WORKDIR /app

# Installiere Dependencies
COPY package*.json ./
RUN npm ci

# Kopiere Prisma Schema
COPY prisma ./prisma

# Generiere Prisma Client
RUN npx prisma generate

# Kopiere Source
COPY . .

# Baue TypeScript
RUN npm run build

# Exponiere Port
EXPOSE 3000

# Starte Anwendung
CMD ["node", "dist/index.js"]

