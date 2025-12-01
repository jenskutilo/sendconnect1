# SendConnect VPS Deployment-Anleitung

Diese Anleitung führt Sie durch die Installation von SendConnect auf einem Linux VPS (Ubuntu/Debian).

## Voraussetzungen

- VPS mit Root-Zugang
- SSH-Client (Windows: PuTTY oder WSL, Mac/Linux: Terminal)
- SSH-Zugangsdaten vom Hoster

## Schritt 1: SSH-Verbindung herstellen

### Windows (PuTTY)
1. PuTTY herunterladen und öffnen
2. Hostname/IP-Adresse eingeben
3. Port: 22
4. Verbindungstyp: SSH
5. "Open" klicken
6. Login: `root`
7. Passwort eingeben (wird nicht angezeigt)

### Mac/Linux (Terminal)
```bash
ssh root@IHRE_IP_ADRESSE
# Passwort eingeben
```

## Schritt 2: System aktualisieren

```bash
# Zuerst: Speicherplatz prüfen und aufräumen
df -h

# APT-Cache leeren (frei Speicherplatz)
apt clean
apt autoclean

# Alte Pakete entfernen
apt autoremove -y

# System aktualisieren
apt update && apt upgrade -y

# Wichtige Tools installieren
apt install -y curl wget git build-essential
```

**Hinweis**: Falls `/` fast voll ist (über 90%), siehe "Troubleshooting: Speicherplatz" am Ende dieser Anleitung.

## Schritt 3: Node.js installieren

```bash
# Node.js 20.x installieren (LTS Version)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Version prüfen
node --version
npm --version
```

## Schritt 4: PostgreSQL installieren

```bash
# PostgreSQL installieren
apt install -y postgresql postgresql-contrib

# PostgreSQL starten und aktivieren
systemctl start postgresql
systemctl enable postgresql

# Datenbank und User erstellen
sudo -u postgres psql << EOF
CREATE DATABASE sendconnect;
CREATE USER sendconnect WITH PASSWORD 'ÄNDERN_SIE_DIESES_PASSWORT';
GRANT ALL PRIVILEGES ON DATABASE sendconnect TO sendconnect;
\q
EOF
```

**WICHTIG**: Ersetzen Sie `ÄNDERN_SIE_DIESES_PASSWORT` mit einem starken Passwort!

## Schritt 5: Redis installieren

```bash
# Redis installieren
apt install -y redis-server

# Redis konfigurieren
sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf
echo "maxmemory 512mb" >> /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf

# Redis starten und aktivieren
systemctl restart redis-server
systemctl enable redis-server

# Test
redis-cli ping
# Sollte "PONG" zurückgeben
```

## Schritt 6: Firewall konfigurieren

```bash
# UFW installieren (falls nicht vorhanden)
apt install -y ufw

# SSH erlauben
ufw allow 22/tcp

# Backend API Port erlauben
ufw allow 3000/tcp

# Frontend Port erlauben (falls direkt auf VPS)
ufw allow 80/tcp
ufw allow 443/tcp

# Firewall aktivieren
ufw --force enable

# Status prüfen
ufw status
```

## Schritt 7: SendConnect hochladen

### Option A: Git Clone (empfohlen, wenn Repository vorhanden)

```bash
# In Home-Verzeichnis wechseln
cd ~

# Repository klonen (ersetzen Sie mit Ihrem Repository)
git clone https://github.com/IHR_USERNAME/SendConnect.git
cd SendConnect
```

### Option B: Manueller Upload

1. Projekt lokal als ZIP packen
2. Mit SCP hochladen:
   ```bash
   # Auf Ihrem lokalen Computer:
   scp -r SendConnect root@IHRE_IP:/root/
   ```
3. Auf dem Server:
   ```bash
   cd /root/SendConnect
   ```

## Schritt 8: Backend konfigurieren

```bash
# In Backend-Verzeichnis wechseln
cd backend

# Dependencies installieren
npm install

# .env Datei erstellen
cp .env.example .env
nano .env
```

Bearbeiten Sie die `.env` Datei:

```env
# Database (Passwort aus Schritt 4 verwenden)
DATABASE_URL="postgresql://sendconnect:IHRE_PASSWORT@localhost:5432/sendconnect?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (WICHTIG: Ändern Sie diese!)
JWT_SECRET="ERZEUGEN_SIE_EINEN_ZUFÄLLIGEN_STRING_MINDESTENS_32_ZEICHEN"
JWT_REFRESH_SECRET="ERZEUGEN_SIE_EINEN_WEITEREN_ZUFÄLLIGEN_STRING_MINDESTENS_32_ZEICHEN"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Admin User
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ÄNDERN_SIE_DIESES_PASSWORT"

# App
NODE_ENV="production"
PORT=3000
FRONTEND_URL="http://IHRE_IP:5173"
BACKEND_URL="http://IHRE_IP:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Defaults
DEFAULT_FROM_NAME="SendConnect"
DEFAULT_FROM_EMAIL="noreply@example.com"
DEFAULT_REPLY_TO="support@example.com"

# URLs (später mit Domain anpassen)
UNSUBSCRIBE_BASE_URL="http://IHRE_IP:3000/api/unsubscribe"
OPTIN_BASE_URL="http://IHRE_IP:3000/api/optin"
TRACKING_BASE_URL="http://IHRE_IP:3000/api/tracking"
```

**Zufällige Strings generieren:**
```bash
# Auf dem Server ausführen:
openssl rand -base64 32
```

Speichern: `Ctrl+O`, `Enter`, `Ctrl+X`

## Schritt 9: Datenbank-Migrationen

```bash
# Prisma Client generieren
npm run prisma:generate

# Migrationen ausführen
npm run prisma:migrate:deploy

# Seed-Datenbank (erstellt Admin-User)
npm run prisma:seed
```

## Schritt 10: Backend bauen

```bash
# TypeScript kompilieren
npm run build
```

## Schritt 11: Frontend konfigurieren

```bash
# In Frontend-Verzeichnis wechseln
cd ../frontend

# Dependencies installieren
npm install

# .env Datei erstellen
cp .env.example .env
nano .env
```

Bearbeiten Sie die `.env` Datei:

```env
VITE_API_URL=http://IHRE_IP:3000/api
```

Speichern: `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Frontend bauen
npm run build
```

## Schritt 12: Systemd Services erstellen

### Backend Service

```bash
# Service-Datei erstellen
nano /etc/systemd/system/sendconnect-api.service
```

Inhalt:

```ini
[Unit]
Description=SendConnect API Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/SendConnect/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Speichern: `Ctrl+O`, `Enter`, `Ctrl+X`

### Worker Service

```bash
# Service-Datei erstellen
nano /etc/systemd/system/sendconnect-worker.service
```

Inhalt:

```ini
[Unit]
Description=SendConnect Email Worker
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/SendConnect/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/worker.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Speichern: `Ctrl+O`, `Enter`, `Ctrl+X`

### Services aktivieren und starten

```bash
# Systemd neu laden
systemctl daemon-reload

# Services aktivieren (starten bei Boot)
systemctl enable sendconnect-api
systemctl enable sendconnect-worker

# Services starten
systemctl start sendconnect-api
systemctl start sendconnect-worker

# Status prüfen
systemctl status sendconnect-api
systemctl status sendconnect-worker
```

## Schritt 13: Nginx installieren (für Frontend)

```bash
# Nginx installieren
apt install -y nginx

# Nginx konfigurieren
nano /etc/nginx/sites-available/sendconnect
```

Inhalt:

```nginx
server {
    listen 80;
    server_name IHRE_IP;

    # Frontend
    location / {
        root /root/SendConnect/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Speichern: `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Symlink erstellen
ln -s /etc/nginx/sites-available/sendconnect /etc/nginx/sites-enabled/

# Standard-Config entfernen
rm /etc/nginx/sites-enabled/default

# Nginx testen
nginx -t

# Nginx starten
systemctl restart nginx
systemctl enable nginx
```

## Schritt 14: Testen

1. **Backend testen:**
   ```bash
   curl http://localhost:3000/health
   ```
   Sollte `{"status":"ok","database":"connected"}` zurückgeben

2. **Frontend öffnen:**
   Öffnen Sie im Browser: `http://IHRE_IP`

3. **Login:**
   - E-Mail: Die aus `.env` (ADMIN_EMAIL)
   - Passwort: Die aus `.env` (ADMIN_PASSWORD)

## Schritt 15: Logs prüfen

```bash
# Backend Logs
journalctl -u sendconnect-api -f

# Worker Logs
journalctl -u sendconnect-worker -f

# Nginx Logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Wichtige Befehle

### Services neu starten
```bash
systemctl restart sendconnect-api
systemctl restart sendconnect-worker
systemctl restart nginx
```

### Services stoppen
```bash
systemctl stop sendconnect-api
systemctl stop sendconnect-worker
```

### Status prüfen
```bash
systemctl status sendconnect-api
systemctl status sendconnect-worker
systemctl status postgresql
systemctl status redis-server
systemctl status nginx
```

## Nächste Schritte

1. **SMTP-Profil erstellen** in der SendConnect-Oberfläche
2. **Liste erstellen** und Kontakte importieren
3. **Test-Kampagne** erstellen und versenden
4. **Domain einrichten** (optional, später)
5. **SSL-Zertifikat** einrichten (Let's Encrypt)

## Troubleshooting

### Speicherplatz-Problem

Falls Sie die Fehlermeldung `E: You don't have enough free space` erhalten:

```bash
# 1. Speicherplatz prüfen
df -h

# 2. APT-Cache leeren
apt clean
apt autoclean

# 3. Alte Pakete entfernen
apt autoremove -y

# 4. Große Dateien finden
du -h --max-depth=1 / | sort -hr | head -20

# 5. Logs aufräumen (falls zu groß)
journalctl --vacuum-time=3d

# 6. Temporäre Dateien löschen
rm -rf /tmp/*
rm -rf /var/tmp/*

# 7. Docker-Images/Container aufräumen (falls Docker installiert)
docker system prune -a

# 8. Prüfen ob Partition erweitert werden kann
lsblk
```

**Falls `/` nur 3-4GB hat, aber 80GB SSD vorhanden sein sollten:**

```bash
# Partition-Info prüfen
fdisk -l
lsblk

# Falls ungenutzter Speicher vorhanden, Partition erweitern (VORSICHT!)
# Nur wenn Sie wissen was Sie tun!
# growpart /dev/sda 1
# resize2fs /dev/sda1
```

**Alternative: Installation in `/opt` oder `/home` verschieben, falls dort mehr Platz ist.**

### Backend startet nicht
```bash
# Logs prüfen
journalctl -u sendconnect-api -n 50

# Manuell starten zum Debuggen
cd /root/SendConnect/backend
node dist/index.js
```

### Worker startet nicht
```bash
# Logs prüfen
journalctl -u sendconnect-worker -n 50

# Redis-Verbindung testen
redis-cli ping
```

### Datenbank-Verbindungsfehler
```bash
# PostgreSQL Status prüfen
systemctl status postgresql

# Verbindung testen
sudo -u postgres psql -c "SELECT 1;"
```

## Sicherheit

1. **SSH-Key-Authentifizierung** einrichten (statt Passwort)
2. **Fail2ban** installieren für SSH-Schutz
3. **Firewall** weiter konfigurieren
4. **Regelmäßige Updates** durchführen

## Backup

```bash
# Datenbank-Backup-Script erstellen
nano /root/backup-sendconnect.sh
```

Inhalt:

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U sendconnect sendconnect > $BACKUP_DIR/sendconnect_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

```bash
chmod +x /root/backup-sendconnect.sh

# Cron-Job für tägliches Backup (2 Uhr morgens)
crontab -e
# Fügen Sie hinzu:
0 2 * * * /root/backup-sendconnect.sh
```

---

**Fertig!** SendConnect sollte jetzt auf Ihrem VPS laufen. 🚀

