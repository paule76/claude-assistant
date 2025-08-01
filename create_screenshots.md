# Screenshot-Erstellung Anleitung

## Vorbereitung

1. **Test-Webseiten vorbereiten:**
   - Wikipedia-Artikel (gut für Zusammenfassungen)
   - GitHub Repository (für Code-Analyse)
   - News-Webseite (für Content-Analyse)
   - E-Commerce Seite (für SEO-Analyse)

2. **Extension vorbereiten:**
   - Dummy API-Key eintragen: `sk-ant-api03-DEMO-KEY-NOT-REAL-xxxxxx`
   - Chat-Historie mit guten Beispielen füllen
   - Verschiedene Einstellungen testen

## Screenshot-Größen

Chrome Web Store akzeptiert:
- **1280x800** (empfohlen - 16:10)
- **640x400** (16:10)

## Schritt-für-Schritt Screenshots

### Screenshot 1: Hero Shot (Hauptansicht)
```
1. Öffne https://de.wikipedia.org/wiki/Künstliche_Intelligenz
2. Starte Extension
3. Frage: "Was sind die wichtigsten Punkte dieses Artikels?"
4. Warte auf Claude's Antwort
5. Screenshot wenn Antwort vollständig
```

### Screenshot 2: Einstellungen Panel
```
1. Klicke auf Zahnrad
2. Stelle sicher dass alle Optionen sichtbar sind
3. API-Key Feld sollte Dummy-Key zeigen
4. Modell: Claude Sonnet 3.7 ausgewählt
5. Screenshot mit offenem Panel
```

### Screenshot 3: Kontextuelle Analyse
```
1. Öffne eine Business-Webseite
2. Kontext-Feld: "Analysiere die SEO-Optimierung dieser Seite"
3. Stelle eine relevante Frage
4. Screenshot mit Kontext und Antwort
```

### Screenshot 4: Modell-Auswahl
```
1. Öffne Einstellungen
2. Klicke auf Modell-Dropdown
3. Screenshot während Dropdown offen ist
4. Zeige alle verfügbaren Modelle
```

### Screenshot 5: Längerer Chat
```
1. Führe eine Unterhaltung mit 5-6 Nachrichten
2. Zeige verschiedene Frage-Typen
3. Screenshot mit gescrolltem Chat
```

## Tools für Screenshots

### macOS:
```bash
# Fenster-Screenshot mit Schatten
Cmd + Shift + 4, dann Leertaste

# Bereich ohne Schatten  
Cmd + Shift + 4

# Mit Timer (für Dropdowns)
Screenshot App → Options → Timer 5s
```

### Chrome DevTools:
```
1. F12 öffnen
2. Toggle device toolbar (Cmd+Shift+M)
3. Responsive → Edit → Add custom device
4. 1280x800, Scale 100%
5. Capture screenshot (Kamera-Icon)
```

### Empfohlene Tools:
- **Shottr** (macOS) - Annotations
- **ShareX** (Windows)
- **Flameshot** (Linux)

## Nachbearbeitung

### Annotationen hinzufügen:
- Pfeile zu wichtigen Features
- Highlight-Boxen für Buttons
- Nummerierung für Schritte

### Konsistenz:
- Gleicher Browser
- Gleiche Zoom-Stufe (100%)
- Gleiche Fenster-Größe
- Saubere Browser-UI (keine anderen Extensions)

## Promo-Grafiken erstellen

### Tools:
- **Canva** - Einfache Templates
- **Figma** - Professionelles Design
- **GIMP/Photoshop** - Volle Kontrolle

### Template-Idee für Promo:
```
+------------------------+
|   Claude Web Analyzer  |
|                       |
|  [Extension Icon]     |
|                       |
| "Chat with Claude AI  |
|  about any webpage"   |
|                       |
| • Multiple Models     |
| • Encrypted Storage   |
| • Privacy First       |
+------------------------+
```

## Checkliste vor Upload

- [ ] Keine echten API-Keys sichtbar
- [ ] Keine persönlichen Daten
- [ ] Keine anstößigen Inhalte in Beispielen
- [ ] Gute Bildqualität (nicht verpixelt)
- [ ] Einheitliches Design
- [ ] Korrekte Größe (1280x800)
- [ ] Aussagekräftige Beispiele

## Beispiel-Prompts für Screenshots

1. "Fasse die wichtigsten Punkte dieser Seite zusammen"
2. "Welche SEO-Verbesserungen würdest du vorschlagen?"
3. "Erkläre den Code auf dieser Seite"
4. "Ist diese Seite barrierefrei?"
5. "Welche Sicherheitsprobleme siehst du?"