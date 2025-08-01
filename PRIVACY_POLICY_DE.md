# Datenschutzerklärung für Claude Assistant

**Zuletzt aktualisiert: Februar 2025**

## Überblick

Claude Assistant ist eine Chrome-Erweiterung, die es Nutzern ermöglicht, Webinhalte mit Claude AI von Anthropic zu analysieren. Diese Datenschutzerklärung erklärt, wie wir mit Ihren Daten umgehen.

## Datenerfassung und -nutzung

### 1. Webseiteninhalt
- **Was wir erfassen**: Bei Nutzung der Erweiterung liest diese den Inhalt der aktuellen Webseite, einschließlich:
  - Textinhalt der Seite
  - Seitentitel und URL
  - Links auf der Seite (optional)
  - Bildinformationen (optional)
  - Meta-Tags (optional)
  - Vollständiger HTML-Code (optional - basierend auf Ihren Einstellungen)
  
- **Wie wir es nutzen**: Dieser Inhalt wird basierend auf Ihren Anfragen zur Analyse an die Claude API von Anthropic gesendet. Wir speichern Webseiteninhalte nicht dauerhaft.

### 2. API-Schlüssel-Speicherung
- **Was wir erfassen**: Ihren Anthropic API-Schlüssel (erforderlich für die Funktion des Dienstes)
- **Wie wir ihn speichern**: 
  - API-Schlüssel werden vor der Speicherung mit XOR-Verschlüsselung verschlüsselt
  - Gespeichert in Chromes Sync-Speicher (chrome.storage.sync)
  - Über Ihre Geräte synchronisiert, wenn Sie in Chrome angemeldet sind
  - Niemals irgendwohin übertragen außer an die API von Anthropic
- **Sicherheit**: Schlüssel werden niemals im Klartext gespeichert und nur bei Bedarf für API-Aufrufe entschlüsselt

### 3. Chat-Verlauf
- **Was wir erfassen**: Ihren Gesprächsverlauf mit Claude
- **Wie wir ihn speichern**: 
  - Lokal in Ihrem Browser gespeichert (chrome.storage.local)
  - Begrenzt auf die letzten 50 Nachrichten
  - Nicht zwischen Geräten synchronisiert
  - Kann jederzeit über die Schaltfläche "Chat löschen" gelöscht werden

### 4. Erweiterungseinstellungen
- **Was wir erfassen**: Ihre Präferenzen, einschließlich:
  - Ausgewähltes Claude-Modell
  - Präferenzen für einzuschließende Inhalte
  - Maximale Inhaltslänge
  - Antworteinstellungen (Temperatur, maximale Token)
- **Wie wir sie speichern**: In Chromes Sync-Speicher, synchronisiert über Ihre Geräte

## Drittanbieterdienste

### Anthropic API
- Webinhalte und Ihre Anfragen werden an die Claude API von Anthropic gesendet
- Dies ist für die KI-Analysefunktionalität erforderlich
- Die Datenschutzrichtlinie von Anthropic gilt für an deren Dienst gesendete Daten
- Mehr erfahren unter: https://www.anthropic.com/privacy

## Datenweitergabe
- **Wir werden NICHT**:
  - Ihre Daten an Dritte weitergeben (außer an Anthropic für die API-Funktionalität)
  - Ihre Daten verkaufen
  - Ihre Daten für Werbung verwenden
  - Ihren Browserverlauf verfolgen
  - Analysen sammeln

## Datenspeicherung
- **API-Schlüssel**: Gespeichert bis Sie sie entfernen oder die Erweiterung deinstallieren
- **Chat-Verlauf**: Lokal gespeichert bis zur Löschung oder Deinstallation der Erweiterung
- **Einstellungen**: Gespeichert bis zur Änderung oder Deinstallation der Erweiterung
- **Webinhalte**: Nicht gespeichert - nur temporär für API-Anfragen verarbeitet

## Ihre Rechte
Sie haben das Recht:
- Alle gespeicherten Daten in Chromes Erweiterungsspeicher einzusehen
- Ihren Chat-Verlauf jederzeit zu löschen
- Ihren API-Schlüssel jederzeit zu entfernen
- Die Erweiterung zu deinstallieren, wodurch alle lokalen Daten entfernt werden
- Chrome-Sync zu deaktivieren, um die geräteübergreifende Synchronisierung zu verhindern

## Sicherheitsmaßnahmen
- API-Schlüssel werden vor der Speicherung verschlüsselt
- Alle Kommunikation mit Anthropic verwendet HTTPS
- Keine Daten werden auf externen Servern gespeichert (nur Chrome-Speicher)
- Erweiterung verwendet minimal erforderliche Berechtigungen

## Aktualisierungen
Diese Datenschutzerklärung kann aktualisiert werden, um Änderungen in der Erweiterung widerzuspiegeln. Aktualisierungen werden mit einem neuen "Zuletzt aktualisiert"-Datum vermerkt.

## Kontakt
Bei Fragen zu dieser Datenschutzerklärung oder der Erweiterung:
- GitHub: https://github.com/paule76/claude-assistant
- Erstellen Sie ein Issue im GitHub-Repository

## Compliance
Diese Erweiterung ist darauf ausgelegt, Folgendes einzuhalten:
- Chrome Web Store-Richtlinien
- DSGVO-Prinzipien (Nutzerkontrolle, Datenminimierung, Zweckbindung)
- Allgemeine Best Practices für Datenschutz

Durch die Nutzung von Claude Assistant stimmen Sie dieser Datenschutzerklärung und der Verarbeitung Ihrer Daten wie oben beschrieben zu.