# Fork von marcerdorf

Persönlicher Fork von [hetpatel-11/Adobe_Premiere_Pro_MCP](https://github.com/hetpatel-11/Adobe_Premiere_Pro_MCP) (MIT). Genutzt für den Videoschnitt von RoamWithME in Premiere Pro auf macOS. Antworten auf Deutsch, per du.

## Stand und Entscheidung (11/2026)

- Dieser Fork ist die aktive Premiere-Bridge. Installiert lokal aus `~/Developer/Adobe_Premiere_Pro_MCP` per `npm run setup:mac`, nicht über npm.
- Eigene Änderungen bisher nur am Panel: `cep-plugin/index.html` und `cep-plugin/ui.js` (Spectrum 2, deutsch, hell und dunkel). `bridge-cep.js` ist unverändert, damit Merges vom Original konfliktfrei bleiben.
- Eine eigene Suite-Bridge für die ganze Creative Cloud ist **pausiert**. Grund: Adobe hat auf der MAX 2026 lokale MCP-Integrationen für Photoshop, Illustrator, Premiere und After Effects angekündigt, als private Beta Anfang 2027. Umfang noch offen.
- In den Fork nur investieren, was im Schnitt-Alltag wirklich gebraucht wird.

## Regeln für die Arbeit mit Premiere

- **Vor jeder Änderung frisch auslesen.** Der MCP vergibt Clip-IDs bei jedem Auslesen neu. Ein Zwischen-Auslesen einer anderen Sequenz hat einmal dazu geführt, dass statt eines Audio-Schnipsels der Clip "VO-25.wav" gelöscht wurde (per `undo` behoben).
- Nach jeder Änderung prüfen, ob genau das Ziel betroffen war, und bei Abweichung sofort `undo`.
- Projekte nicht selbst speichern. Marc hört Änderungen an und speichert selbst.

## Updates vom Original

```
git fetch upstream && git merge upstream/main && npm run build && npm run setup:mac
```

Danach Claude Desktop und Premiere neu starten. Den Update-Hinweis im Panel (npm-Befehl des Originals) **nicht** verwenden, er überschreibt die Fork-Installation.

## Test für Adobes MCP-Beta

Sobald die Beta verfügbar ist, an diesen Aufgaben messen. Besteht Adobes MCP alle, läuft der Fork aus. Fällt er durch, nur die Lücken gezielt füllen, dann auf UXP statt CEP.

- [ ] Clip schneiden (Razor) und Ripple Delete
- [ ] Verschachtelte Sequenzen und Übergänge auf eigener Spur
- [ ] Gezieltes Ansprechen einzelner Spuren (z. B. Musik vs. VO)
- [ ] Lumetri-Werte setzen
- [ ] Export mit eigenem Preset

## Risiken und offene Punkte

- CEP und ExtendScript laufen aus: Adobe gibt jeder App ab ihrer UXP-Beta zwei Jahre Übergang. Für Premiere läuft die Frist bereits. Ein Nachfolger muss auf UXP setzen.
- Lightroom Classic fehlt in Adobes Ankündigung. Kandidat bei Bedarf: [lightroom-cli](https://pypi.org/project/lightroom-cli) (MIT).
- Telemetrie im Panel bleibt aus.
