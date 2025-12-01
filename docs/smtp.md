# SMTP-Konfiguration

SendConnect unterstützt mehrere SMTP-Profile für den E-Mail-Versand.

## SMTP-Profil erstellen

1. Navigieren Sie zu "SMTP-Profile" in der Sidebar
2. Klicken Sie auf "Neues Profil"
3. Füllen Sie die folgenden Felder aus:

### Erforderliche Felder

- **Name**: Ein beschreibender Name für das Profil (z.B. "Haupt-SMTP")
- **Host**: SMTP-Server-Adresse (z.B. `smtp.gmail.com`)
- **Port**: SMTP-Port (z.B. `587` für TLS, `465` für SSL, `25` für None)
- **Verschlüsselung**: 
  - `SSL` für Port 465
  - `TLS` für Port 587
  - `None` für Port 25
- **Benutzername**: SMTP-Benutzername
- **Passwort**: SMTP-Passwort oder App-Passwort
- **Absender-E-Mail**: Standard-E-Mail-Adresse für den Versand

### Optionale Felder

- **Absendername**: Standard-Name für den Versand
- **Antwort-an**: E-Mail-Adresse für Antworten
- **Rate Limit**: Maximale Anzahl E-Mails pro Stunde (Standard: 100)

### Standard-Profil

Sie können ein Profil als Standard markieren. Dieses wird verwendet, wenn keine spezifische SMTP-Profil-ID in einer Kampagne angegeben ist.

## Test-Mail senden

1. Klicken Sie auf ein SMTP-Profil
2. Geben Sie eine Test-E-Mail-Adresse ein
3. Klicken Sie auf das E-Mail-Icon
4. Prüfen Sie Ihr Postfach

## Häufige SMTP-Anbieter

### Gmail

- **Host**: `smtp.gmail.com`
- **Port**: `587` (TLS) oder `465` (SSL)
- **Benutzername**: Ihre Gmail-Adresse
- **Passwort**: App-Passwort (nicht Ihr normales Passwort!)
  - Erstellen Sie ein App-Passwort in Ihrem Google-Konto

### Outlook/Office 365

- **Host**: `smtp.office365.com`
- **Port**: `587` (TLS)
- **Benutzername**: Ihre Outlook-Adresse
- **Passwort**: Ihr Passwort

### SendGrid

- **Host**: `smtp.sendgrid.net`
- **Port**: `587` (TLS)
- **Benutzername**: `apikey`
- **Passwort**: Ihr SendGrid API-Key

### Mailgun

- **Host**: `smtp.mailgun.org`
- **Port**: `587` (TLS)
- **Benutzername**: Ihr Mailgun-Benutzername
- **Passwort**: Ihr Mailgun-Passwort

### Amazon SES

- **Host**: `email-smtp.REGION.amazonaws.com` (ersetzen Sie REGION)
- **Port**: `587` (TLS)
- **Benutzername**: Ihr SES SMTP-Benutzername
- **Passwort**: Ihr SES SMTP-Passwort

## Rate Limiting

Jedes SMTP-Profil hat ein konfigurierbares Rate Limit (Mails pro Stunde). Dies hilft:

- Spam-Filter zu vermeiden
- Die Limits Ihres SMTP-Anbieters einzuhalten
- Die Zustellrate zu verbessern

**Empfehlungen:**
- Gmail: 100-200 Mails/Stunde
- SendGrid: 100-600 Mails/Stunde (je nach Plan)
- Amazon SES: 200-1000 Mails/Stunde (je nach Reputation)

## Best Practices

1. **Verwenden Sie dedizierte SMTP-Server** für Produktion (nicht Gmail/Outlook)
2. **Setzen Sie realistische Rate Limits** basierend auf Ihrem Anbieter
3. **Testen Sie immer** mit einer Test-Mail vor dem Versand großer Kampagnen
4. **Überwachen Sie Bounce-Raten** und passen Sie Limits an
5. **Verwenden Sie SPF, DKIM und DMARC** für bessere Zustellrate

