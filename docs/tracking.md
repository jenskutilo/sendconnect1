# Tracking & Statistiken

SendConnect bietet umfassendes Tracking für E-Mail-Kampagnen.

## Open-Tracking

Jede versendete E-Mail enthält einen unsichtbaren 1x1-Pixel, der beim Öffnen der E-Mail geladen wird.

### Funktionsweise

1. Beim Versand wird ein Tracking-Pixel in die E-Mail eingefügt
2. Beim Öffnen der E-Mail wird das Pixel geladen
3. SendConnect registriert die Öffnung mit:
   - Zeitstempel
   - IP-Adresse (optional)
   - User-Agent (optional)

### Platzhalter

Verwenden Sie `{{tracking_pixel}}` im HTML-Inhalt. Dieser wird automatisch durch den Tracking-Pixel ersetzt.

**Hinweis**: Das Tracking-Pixel wird automatisch eingefügt, auch wenn Sie den Platzhalter vergessen.

## Click-Tracking

Alle Links in E-Mails werden automatisch durch Tracking-Links ersetzt.

### Funktionsweise

1. Beim Versand werden alle Links durch Tracking-Links ersetzt
2. Beim Klick wird der Klick registriert
3. Der Benutzer wird zur ursprünglichen URL weitergeleitet

### Registrierte Daten

- Zeitstempel
- Original-URL
- IP-Adresse (optional)
- User-Agent (optional)

## Statistiken

### Dashboard

Das Dashboard zeigt eine Übersicht über:

- **Gesamt Kontakte**: Anzahl aller Kontakte
- **Gesamt Listen**: Anzahl aller Listen
- **Versendet (30 Tage)**: Anzahl versendeter E-Mails in den letzten 30 Tagen
- **Öffnungsrate**: Durchschnittliche Öffnungsrate

### Kampagnen-Statistiken

Für jede Kampagne sehen Sie:

- **Versendet**: Anzahl versendeter E-Mails
- **Geöffnet**: 
  - Total: Gesamtanzahl Öffnungen
  - Unique: Anzahl eindeutiger Empfänger, die geöffnet haben
- **Geklickt**:
  - Total: Gesamtanzahl Klicks
  - Unique: Anzahl eindeutiger Empfänger, die geklickt haben
- **Bounces**: Anzahl Bounces (Hard/Soft)
- **Öffnungsrate**: (Unique Öffnungen / Versendet) × 100
- **Klickrate**: (Unique Klicks / Versendet) × 100

### Tagesstatistiken

Das Dashboard zeigt ein Diagramm der Aktivität der letzten 30 Tage mit:

- Versendete E-Mails pro Tag
- Öffnungen pro Tag
- Klicks pro Tag

## Bounce-Tracking

SendConnect unterscheidet zwischen:

- **Hard Bounce**: Permanente Fehler (z.B. ungültige E-Mail-Adresse)
- **Soft Bounce**: Temporäre Fehler (z.B. Postfach voll)

Kontakte mit Hard Bounces werden automatisch auf Status "BOUNCED" gesetzt.

## Datenschutz

### IP-Adressen

IP-Adressen werden optional gespeichert. Sie können dies in den Einstellungen deaktivieren.

### Opt-Out

Empfänger können sich jederzeit über den Abmeldelink abmelden. Abgemeldete Kontakte erhalten keine weiteren E-Mails.

## Best Practices

1. **Überwachen Sie Bounce-Raten**: Hohe Bounce-Raten können Ihre Reputation schädigen
2. **Prüfen Sie Öffnungsraten**: Niedrige Raten können auf Spam-Filter hinweisen
3. **Analysieren Sie Klickraten**: Zeigt die Relevanz Ihres Inhalts
4. **Bereinigen Sie Listen**: Entfernen Sie regelmäßig Bounced-Kontakte
5. **Respektieren Sie Abmeldungen**: Entfernen Sie abgemeldete Kontakte aus Listen

## Export

Statistiken können über die API exportiert werden. Eine CSV-Export-Funktion ist in Planung.

