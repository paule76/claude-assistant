# Claude Assistent

<p align="center">
  <img src="src/icon128-new.png" alt="Claude Assistent Logo" width="128" height="128">
</p>

<p align="center">
  <strong>Dein KI-Assistent für jede Webseite - powered by Claude</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#einrichtung">Einrichtung</a> •
  <a href="#demo-modus">Demo-Modus</a> •
  <a href="#datenschutz">Datenschutz</a>
</p>

<p align="center">
  <a href="README.md">🇬🇧 English Version</a>
</p>

## 🚀 Funktionen

- 💬 **Intelligente Chat-Oberfläche** - Interaktiver KI-Assistent für jede Webseite
- 🌐 **Domain-spezifische Chats** - Separater Verlauf pro Webseite
- 📝 **Markdown-Unterstützung** - Rich-Text-Formatierung mit Syntax-Highlighting
- 📸 **Text & Screenshot-Erfassung** - Markiere Text oder erfasse visuellen Inhalt
- 🤖 **Mehrere Claude-Modelle** - Opus 4, Sonnet 4, Sonnet 3.7, Sonnet 3.5 und Haiku 3.5
- 🔒 **Sichere API-Speicherung** - Verschlüsselter API-Key mit Chrome Sync
- 🎯 **Demo-Modus** - Teste ohne API-Key
- 📦 **4 Größen-Optionen** - S/M/L/XL Popup-Größen
- 🆕 **Tab-Modus** - Öffne Chat im vollen Browser-Tab
- 🌍 **Mehrsprachig** - Englisch und Deutsch
- ⚙️ **Anpassbar** - Kontrolliere welche Webseiten-Daten analysiert werden
- 🔐 **Privatsphäre zuerst** - Deine Daten bleiben lokal

## 📦 Installation

### Option 1: Chrome Web Store
*Demnächst verfügbar!*

### Option 2: Manuelle Installation

1. Repository klonen:
```bash
git clone https://github.com/paule76/claude-assistant.git
cd claude-assistant
```

2. Chrome öffnen und zu `chrome://extensions/` navigieren

3. "Entwicklermodus" oben rechts aktivieren

4. "Entpackte Erweiterung laden" klicken

5. Den `src/` Ordner auswählen

## 🔧 Einrichtung

### Mit eigenem API-Key (Empfohlen)

1. Hole dir einen API-Key von [console.anthropic.com](https://console.anthropic.com)
2. Klicke auf das Extension-Icon
3. Öffne die Einstellungen (⚙️)
4. Gib deinen API-Key ein und speichere

### Demo-Modus

- Lasse das API-Key Feld leer
- Die Extension zeigt Demo-Antworten
- Perfekt zum Testen der Funktionalität

## 💡 Anwendungsfälle

- **SEO-Analyse** - Prüfe Meta-Tags, Struktur und Optimierungen
- **Content-Zusammenfassung** - Fasse lange Artikel zusammen
- **Code-Review** - Analysiere den Code einer Webseite
- **Barrierefreiheit** - Prüfe Accessibility-Aspekte
- **Sicherheitsanalyse** - Finde potenzielle Probleme

## 🛡️ Datenschutz

- **Keine Datensammlung** - Wir sammeln keine Nutzungsdaten
- **Verschlüsselte Speicherung** - API-Keys werden verschlüsselt gespeichert
- **Lokale Verarbeitung** - Chat-History bleibt auf deinem Gerät
- **Open Source** - Der Code ist vollständig einsehbar

Siehe unsere [Datenschutzerklärung](PRIVACY_POLICY_DE.md)

## ⚙️ Konfiguration

### Verfügbare Modelle

| Modell | Beschreibung | Anwendungsfall |
|--------|--------------|----------------|
| Claude Opus 4 | Leistungsstärkstes | Komplexe Analysen |
| Claude Sonnet 4 | Ausgewogen | Allgemeine Nutzung |
| Claude Sonnet 3.7 | Empfohlen (Standard) | Beste Balance |
| Claude Haiku 3.5 | Schnell & günstig | Einfache Anfragen |

### Einstellungen

- **Seiteninhalt**: Wähle welche Elemente analysiert werden sollen
- **Maximale Textlänge**: Begrenze große Seiten (Standard: 100KB)
- **Antwortlänge**: Kontrolliere die Länge der Antworten
- **Temperatur**: Kreativität der Antworten (0-1)

## 📊 Kosten

Die Extension ist **kostenlos**. Du zahlst nur für deine API-Nutzung bei Anthropic:

- Claude Haiku 3.5: ~$0.001 pro Anfrage
- Claude Sonnet 3.7: ~$0.003-0.015 pro Anfrage  
- Claude Opus 4: ~$0.015-0.075 pro Anfrage

## 🤝 Mitwirken

Beiträge sind willkommen! Bitte erstelle ein Issue oder Pull Request.

### Entwicklung

```bash
# Repository klonen
git clone https://github.com/paule76/claude-web-analyzer.git

# In src Ordner wechseln
cd claude-web-analyzer/src

# Änderungen machen und testen
# Extension in Chrome nach Änderungen neu laden
```

## 📝 Lizenz

MIT Lizenz - siehe [LICENSE](LICENSE) Datei

## 🙏 Credits

- Entwickelt mit ❤️ von [S.Paul](https://github.com/paule76)
- Powered by [Claude AI](https://anthropic.com) von Anthropic

## 🙏 Besonderer Dank

**Ein RIESIGES Dankeschön an Claude Code für die unglaubliche Entwicklungspartnerschaft!** 🎉

Diese Extension wurde in einer fantastischen 6-stündigen Coding-Session mit Claude Code gebaut, der geholfen hat bei:
- 🏗️ Architektur-Design und Implementierung
- 🐛 Bugfixes und Optimierungen  
- 🎨 UI/UX-Verbesserungen
- 🌍 Internationalisierung (i18n)
- 💡 Unzähligen brillanten Ideen und Lösungen!

Entwickelt mit [Claude Code](https://github.com/anthropics/claude-code) 🤖✨

## 📞 Support

- 🐛 Bugs melden: [GitHub Issues](https://github.com/paule76/claude-web-analyzer/issues)
- 💡 Feature Requests: [GitHub Issues](https://github.com/paule76/claude-web-analyzer/issues)

---

<p align="center">
  <strong>⭐ Wenn dir die Extension gefällt, hinterlasse einen Stern! ⭐</strong>
</p>