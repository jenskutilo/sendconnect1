FROM node:18-alpine

WORKDIR /app

# Installiere Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Kopiere Source
COPY . .

# Generiere Prisma Client
RUN npx prisma generate

# Baue TypeScript
RUN npm run build

# Exponiere Port
EXPOSE 3000

# Starte Anwendung
CMD ["node", "dist/index.js"]

