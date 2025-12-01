# SendConnect

Eine professionelle Mailsender-Suite für legitime Newsletter- und Kampagnen-Mails mit Fokus auf hohe Zustellrate, Compliance und transparente Statistiken.

## Tech-Stack

- **Backend**: Node.js + TypeScript + Express
- **Frontend**: React + TypeScript + Vite
- **Datenbank**: PostgreSQL (oder MySQL) mit Prisma ORM
- **Mailversand**: Nodemailer
- **Queue**: BullMQ mit Redis
- **Auth**: JWT (Access + Refresh Token)

## Features

- ✅ Authentifizierung & Benutzerverwaltung (Admin/User Rollen)
- ✅ SMTP-Profile mit Rate-Limiting
- ✅ Listen & Kontakte mit CSV-Import/Export
- ✅ Kampagnenverwaltung mit Betreff- und Absender-Rotation
- ✅ HTML-Templates mit Platzhaltern
- ✅ Queue-basierter Versand für große Kampagnen
- ✅ Open- und Click-Tracking
- ✅ Spam-Score-Analyse
- ✅ Unsubscribe & Double-Opt-In
- ✅ Umfassende Statistiken & Dashboard

## Schnellstart

### Voraussetzungen

- Node.js 18+ und npm/pnpm/yarn
- PostgreSQL oder MySQL
- Redis (für Queue)

### Installation mit Docker (empfohlen)

```bash
# Klone das Repository
git clone <repository-url>
cd SendConnect

# Kopiere .env.example zu .env und passe die Werte an
cp .env.example .env

# Starte alle Services
docker-compose up -d

# Führe Datenbank-Migrationen aus
cd backend
npm run prisma:migrate
npm run prisma:seed

# Backend starten (in separatem Terminal)
npm run dev:backend

# Frontend starten (in separatem Terminal)
npm run dev:frontend
```

Die Anwendung ist dann verfügbar unter:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Installation ohne Docker

1. **Datenbank einrichten:**
   - PostgreSQL oder MySQL installieren und Datenbank erstellen
   - Redis installieren und starten

2. **Backend einrichten:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Bearbeite .env und setze DB- und Redis-Verbindung
   npm run prisma:migrate
   npm run prisma:seed
   npm run dev
   ```

3. **Frontend einrichten:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Setze VITE_API_URL auf Backend-URL
   npm run dev
   ```

## Umgebungsvariablen

Siehe `.env.example` für alle verfügbaren Konfigurationsoptionen.

### Wichtige Variablen:

- `DATABASE_URL`: PostgreSQL/MySQL Verbindungsstring
- `REDIS_URL`: Redis Verbindungsstring
- `JWT_SECRET`: Geheimer Schlüssel für JWT-Token
- `JWT_REFRESH_SECRET`: Geheimer Schlüssel für Refresh-Token
- `ADMIN_EMAIL`: E-Mail des initialen Admin-Users
- `ADMIN_PASSWORD`: Passwort des initialen Admin-Users

## Produktions-Deployment

### VPS-Deployment (Schritt-für-Schritt)

Eine detaillierte Anleitung für die Installation auf einem Linux VPS finden Sie in:
- [VPS Deployment-Anleitung](docs/deployment-vps.md)

### Schnellstart

1. Baue die Anwendung:
   ```bash
   npm run build
   ```

2. Setze Umgebungsvariablen auf dem Server

3. Führe Datenbank-Migrationen aus:
   ```bash
   cd backend
   npm run prisma:migrate:deploy
   ```

4. Starte Backend (z.B. mit PM2 oder Systemd):
   ```bash
   pm2 start backend/dist/index.js --name sendconnect-api
   pm2 start backend/dist/worker.js --name sendconnect-worker
   ```

5. Serviere Frontend mit einem Webserver (Nginx, Apache) oder CDN

## Dokumentation

- [Setup-Anleitung](docs/setup.md)
- [SMTP-Konfiguration](docs/smtp.md)
- [Kampagnen erstellen](docs/campaigns.md)
- [Tracking & Statistiken](docs/tracking.md)

## Lizenz

Proprietär - Alle Rechte vorbehalten

