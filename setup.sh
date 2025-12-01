#!/bin/bash

echo "🚀 SendConnect Docker Setup"
echo "============================"
echo ""

# Prüfe ob .env existiert
if [ ! -f .env ]; then
    echo "📝 Erstelle .env Datei..."
    cp env.example .env
    
    # Generiere zufällige Secrets
    JWT_SECRET=$(openssl rand -hex 32)
    JWT_REFRESH_SECRET=$(openssl rand -hex 32)
    
    # Ersetze Secrets in .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/dein-super-geheimer-jwt-secret-key-mindestens-32-zeichen-lang/$JWT_SECRET/" .env
        sed -i '' "s/dein-super-geheimer-refresh-secret-key-mindestens-32-zeichen-lang/$JWT_REFRESH_SECRET/" .env
    else
        # Linux
        sed -i "s/dein-super-geheimer-jwt-secret-key-mindestens-32-zeichen-lang/$JWT_SECRET/" .env
        sed -i "s/dein-super-geheimer-refresh-secret-key-mindestens-32-zeichen-lang/$JWT_REFRESH_SECRET/" .env
    fi
    
    echo "✅ .env Datei erstellt mit zufälligen Secrets"
    echo ""
    echo "⚠️  WICHTIG: Bearbeite .env und setze deine Werte:"
    echo "   - ADMIN_EMAIL"
    echo "   - ADMIN_PASSWORD"
    echo "   - FRONTEND_URL (falls du eine Domain hast)"
    echo ""
    read -p "Drücke Enter wenn du fertig bist..."
fi

echo "🐳 Starte Docker Container..."
docker-compose up -d --build

echo ""
echo "⏳ Warte auf Services..."
sleep 10

echo ""
echo "✅ SendConnect läuft jetzt!"
echo ""
echo "🌐 Öffne im Browser:"
echo "   http://localhost"
echo ""
echo "📊 Status prüfen:"
echo "   docker-compose ps"
echo ""
echo "📝 Logs ansehen:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stoppen:"
echo "   docker-compose down"
echo ""

