# 🚀 SendConnect - EINFACH STARTEN

## Auf dem Server:

```bash
# 1. Alte Sachen stoppen
systemctl stop sendconnect-api sendconnect-worker nginx 2>/dev/null || true

# 2. Docker starten
docker-compose up -d --build

# 3. Fertig! Öffne: http://deine-ip
```

## .env erstellen (optional):

```bash
# Erstelle .env mit deinen Werten:
cat > .env << EOF
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
ADMIN_EMAIL=admin@web.de
ADMIN_PASSWORD=Celanoking123!
FRONTEND_URL=http://45.141.58.249
VITE_API_URL=http://45.141.58.249/api
EOF
```

## Wichtige Befehle:

```bash
# Status prüfen
docker-compose ps

# Logs ansehen
docker-compose logs -f

# Stoppen
docker-compose down

# Neu starten
docker-compose restart
```

**DAS WAR'S!**

