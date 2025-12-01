# SendConnect - Docker Setup

## 🚀 Schnellstart

### 1. Setup ausführen

```bash
chmod +x setup.sh
./setup.sh
```

Das Script:
- Erstellt automatisch eine `.env` Datei
- Generiert sichere JWT Secrets
- Startet alle Container

### 2. .env anpassen (optional)

Bearbeite `.env` und setze:
- `ADMIN_EMAIL` - Deine Admin E-Mail
- `ADMIN_PASSWORD` - Dein Admin Passwort
- `FRONTEND_URL` - Deine Domain (falls vorhanden)

### 3. Fertig!

Öffne im Browser: **http://localhost**

## 📋 Befehle

### Container starten
```bash
docker-compose up -d
```

### Container stoppen
```bash
docker-compose down
```

### Logs ansehen
```bash
docker-compose logs -f
```

### Status prüfen
```bash
docker-compose ps
```

### Container neu bauen
```bash
docker-compose up -d --build
```

### Datenbank zurücksetzen
```bash
docker-compose down -v
docker-compose up -d
```

## 🔧 Konfiguration

Alle Einstellungen in `.env`:

- `JWT_SECRET` - Secret für Access Tokens
- `JWT_REFRESH_SECRET` - Secret für Refresh Tokens
- `ADMIN_EMAIL` - Admin E-Mail Adresse
- `ADMIN_PASSWORD` - Admin Passwort
- `FRONTEND_URL` - Frontend URL (für CORS)
- `VITE_API_URL` - API URL für Frontend

## 🌐 Ports

- **80** - Frontend & API (über Nginx)
- **3000** - Backend API (direkt)
- **5432** - PostgreSQL
- **6379** - Redis

## 📦 Services

- **postgres** - Datenbank
- **redis** - Queue/Cache
- **backend** - API Server
- **worker** - E-Mail Worker
- **frontend** - React Frontend
- **nginx** - Reverse Proxy

## 🐛 Troubleshooting

### Container startet nicht
```bash
docker-compose logs [service-name]
```

### Datenbank zurücksetzen
```bash
docker-compose down -v
docker-compose up -d
```

### Frontend zeigt alte Version
```bash
docker-compose restart frontend
```

### Backend Fehler
```bash
docker-compose logs backend
docker-compose restart backend
```

