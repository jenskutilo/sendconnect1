# Setup-Anleitung für SendConnect

Diese Anleitung führt Sie durch die Installation und Einrichtung von SendConnect.

## Voraussetzungen

- Node.js 18 oder höher
- npm, pnpm oder yarn
- PostgreSQL 15+ oder MySQL 8+
- Redis 7+
- (Optional) Docker und Docker Compose

## Installation mit Docker (empfohlen)

### 1. Repository klonen

```bash
git clone <repository-url>
cd SendConnect
```

### 2. Umgebungsvariablen konfigurieren

Kopieren Sie die `.env.example` Dateien und passen Sie sie an:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Bearbeiten Sie `backend/.env` und setzen Sie mindestens:
- `JWT_SECRET` - Ein zufälliger String (mindestens 32 Zeichen)
- `JWT_REFRESH_SECRET` - Ein weiterer zufälliger String (mindestens 32 Zeichen)
- `ADMIN_EMAIL` - E-Mail-Adresse für den initialen Admin-User
- `ADMIN_PASSWORD` - Passwort für den initialen Admin-User

### 3. Services starten

```bash
docker-compose up -d
```

Dies startet:
- PostgreSQL (Port 5432)
- Redis (Port 6379)
- Backend API (Port 3000)
- Worker für E-Mail-Versand

### 4. Datenbank-Migrationen ausführen

```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run prisma:seed
```

### 5. Frontend starten (separat)

```bash
cd frontend
npm install
npm run dev
```

Das Frontend läuft dann auf http://localhost:5173

## Installation ohne Docker

### 1. Datenbank einrichten

Erstellen Sie eine PostgreSQL-Datenbank:

```sql
CREATE DATABASE sendconnect;
CREATE USER sendconnect WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE sendconnect TO sendconnect;
```

### 2. Redis starten

```bash
# Linux/Mac
redis-server

# Windows
# Installieren Sie Redis und starten Sie den Service
```

### 3. Backend einrichten

```bash
cd backend
npm install

# Kopieren Sie .env.example zu .env
cp .env.example .env

# Bearbeiten Sie .env und setzen Sie:
# - DATABASE_URL
# - REDIS_URL
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - ADMIN_EMAIL
# - ADMIN_PASSWORD

# Führen Sie Migrationen aus
npm run prisma:migrate

# Seed-Datenbank
npm run prisma:seed

# Starten Sie den Server
npm run dev
```

### 4. Worker starten (separates Terminal)

```bash
cd backend
npm run worker
```

### 5. Frontend einrichten

```bash
cd frontend
npm install

# Kopieren Sie .env.example zu .env
cp .env.example .env

# Setzen Sie VITE_API_URL auf Ihre Backend-URL
# z.B. VITE_API_URL=http://localhost:3000/api

# Starten Sie den Dev-Server
npm run dev
```

## Erste Schritte

1. Öffnen Sie http://localhost:5173 im Browser
2. Melden Sie sich mit den Admin-Credentials an (aus `.env`)
3. Erstellen Sie ein SMTP-Profil unter "SMTP-Profile"
4. Erstellen Sie eine Liste unter "Listen"
5. Importieren Sie Kontakte oder fügen Sie manuell hinzu
6. Erstellen Sie eine Kampagne und starten Sie sie

## Produktions-Deployment

### Backend

1. Baue das Backend:
   ```bash
   cd backend
   npm run build
   ```

2. Setze Umgebungsvariablen auf dem Server

3. Führe Migrationen aus:
   ```bash
   npm run prisma:migrate:deploy
   ```

4. Starte mit PM2:
   ```bash
   pm2 start dist/index.js --name sendconnect-api
   pm2 start dist/worker.js --name sendconnect-worker
   ```

### Frontend

1. Baue das Frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Serviere die `dist/`-Dateien mit Nginx oder einem anderen Webserver

### Nginx-Konfiguration (Beispiel)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Datenbank-Verbindungsfehler

- Prüfen Sie, ob PostgreSQL läuft
- Überprüfen Sie die `DATABASE_URL` in `.env`
- Stellen Sie sicher, dass die Datenbank existiert

### Redis-Verbindungsfehler

- Prüfen Sie, ob Redis läuft: `redis-cli ping`
- Überprüfen Sie die `REDIS_URL` in `.env`

### Worker sendet keine E-Mails

- Prüfen Sie, ob der Worker-Prozess läuft
- Überprüfen Sie die SMTP-Einstellungen
- Prüfen Sie die Logs: `docker-compose logs worker`

### Frontend kann Backend nicht erreichen

- Überprüfen Sie `VITE_API_URL` in `frontend/.env`
- Prüfen Sie CORS-Einstellungen im Backend
- Stellen Sie sicher, dass das Backend läuft

