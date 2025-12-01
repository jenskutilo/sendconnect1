# Kampagnen erstellen und verwalten

Diese Anleitung zeigt, wie Sie E-Mail-Kampagnen in SendConnect erstellen und verwalten.

## Kampagne erstellen

1. Navigieren Sie zu "Kampagnen" in der Sidebar
2. Klicken Sie auf "Neue Kampagne"
3. Füllen Sie das Formular aus:

### Grundlegende Informationen

- **Name**: Ein beschreibender Name für die Kampagne
- **Liste**: Wählen Sie die Ziel-Liste aus
- **Betreff**: Betreffzeile der E-Mail

### Betreff-Rotation

Sie können mehrere Betreffzeilen eingeben, die rotierend verwendet werden:

1. Geben Sie die erste Betreffzeile ein
2. Klicken Sie auf "+ Weitere Betreffzeile"
3. Geben Sie weitere Betreffzeilen ein

Die Betreffzeilen werden round-robin auf die Empfänger verteilt.

### Absender-Rotation

Ähnlich wie bei Betreffzeilen können Sie mehrere Absender konfigurieren:

1. Geben Sie den Standard-Absendernamen und -E-Mail ein
2. Klicken Sie auf "+ Weitere Absender"
3. Geben Sie weitere Absender ein

### E-Mail-Inhalt

- **HTML-Inhalt**: Der HTML-Inhalt der E-Mail
- **Text-Inhalt** (optional): Eine Text-Version der E-Mail

### Platzhalter

Verwenden Sie Platzhalter im Inhalt:

- `{{first_name}}` - Vorname des Empfängers
- `{{last_name}}` - Nachname des Empfängers
- `{{email}}` - E-Mail-Adresse des Empfängers
- `{{unsubscribe_link}}` - Link zur Abmeldung (wird automatisch ersetzt)
- `{{tracking_pixel}}` - Tracking-Pixel (wird automatisch eingefügt)
- `{{custom_field}}` - Eigene Felder aus den Kontaktdaten

### Planung

- **Sofort senden**: Kampagne startet sofort nach dem Klicken auf "Kampagne starten"
- **Geplant**: Wählen Sie ein Datum und eine Uhrzeit für den Versand

## Kampagne starten

1. Öffnen Sie die Kampagne
2. Klicken Sie auf "Kampagne starten"
3. Die Kampagne wird in die Queue eingereiht und beginnt mit dem Versand

**Hinweis**: Nur Kampagnen mit Status "DRAFT" oder "SCHEDULED" können gestartet werden.

## Kampagnen-Status

- **DRAFT**: Entwurf, noch nicht gestartet
- **SCHEDULED**: Geplant für einen späteren Zeitpunkt
- **SENDING**: Wird aktuell versendet
- **PAUSED**: Pausiert (kann fortgesetzt werden)
- **FINISHED**: Versand abgeschlossen
- **CANCELLED**: Abgebrochen

## Statistiken

Auf der Kampagnen-Detailseite sehen Sie:

- **Versendet**: Anzahl versendeter E-Mails
- **Geöffnet**: Anzahl Öffnungen (total und unique)
- **Geklickt**: Anzahl Klicks (total und unique)
- **Bounces**: Anzahl Bounces (Hard/Soft)

### Öffnungsrate

Die Öffnungsrate wird berechnet als:
```
Öffnungsrate = (Unique Öffnungen / Versendet) × 100
```

### Klickrate

Die Klickrate wird berechnet als:
```
Klickrate = (Unique Klicks / Versendet) × 100
```

## Best Practices

1. **Testen Sie vor dem Versand**: Senden Sie eine Test-Mail an sich selbst
2. **Verwenden Sie Betreff-Rotation**: Erhöht die Zustellrate
3. **Fügen Sie immer einen Abmeldelink hinzu**: Rechtlich erforderlich
4. **Erstellen Sie eine Text-Version**: Bessere Zustellrate
5. **Überwachen Sie Statistiken**: Passen Sie zukünftige Kampagnen an
6. **Vermeiden Sie Spam-Wörter**: Nutzen Sie den Spam-Check

## Spam-Check

Vor dem Versand können Sie einen Spam-Check durchführen:

1. Erstellen Sie die Kampagne
2. Der Spam-Check wird automatisch ausgeführt
3. Prüfen Sie die Bewertung und Empfehlungen
4. Passen Sie den Inhalt bei Bedarf an

Der Spam-Check prüft:
- Vorhandensein eines Abmeldelinks
- Text-Version vorhanden
- Betreff-Qualität (Großbuchstaben, Ausrufezeichen)
- HTML/Text-Verhältnis
- Anzahl Links und Bilder

