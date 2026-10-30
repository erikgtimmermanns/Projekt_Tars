# Baukasten für das Besucher-Overlay

## Zielbild

Das Tablet aktiviert weiterhin einen Besucher über `kiosk_state`. Der Kiosk öffnet
daraufhin das Besucher-Overlay, dessen **globale Vorlage** im Admin getrennt von
den Besucherdaten gepflegt wird. Besucher liefern nur dynamische Werte (`Name`,
`Logo`); das Layout wird nicht pro Besucher dupliziert.

## Datenmodell

`visitor_overlay_configs` enthält genau eine Vorlage je Kiosk-Konfiguration.
`kiosk_settings_id` ist dabei zugleich Primär- und Fremdschlüssel auf
`kiosk_settings(id)`. Das JSONB-Feld `layout` enthält ausschließlich geprüfte
Blöcke mit Rasterposition und Inhalt. Damit bleiben spätere Blocktypen möglich,
ohne jedes Mal die Datenbank zu migrieren.

Unterstützte Blöcke des ersten Ausbaus:

- `text` – freier Text, mit `{{visitor.name}}`
- `visitor-name` – Name des am Tablet gewählten Besuchers
- `visitor-logo` – Logo des am Tablet gewählten Besuchers
- `image` – Bild-URL oder hochgeladenes Bild
- `video` – explizit eingebettete HTTPS-URL

## Umsetzungsphasen

1. **Fundament (dieser Schnitt):** Migration, RLS/Realtimes, gemeinsamer
   Renderer, Admin-Baukasten mit Drag & Drop und Live-Vorschau.
2. **Editor-Komfort:** Raster-Snapping, Größenänderung, Undo/Redo, Duplizieren,
   Vorlagen und Medienbibliothek.
3. **Betrieb:** Entwürfe/Veröffentlichen, Versionshistorie mit Rücksetzen,
   Rechte für Redakteure sowie Telemetrie für fehlerhafte Medien.

## Realtime-Ablauf

`visitor_overlay_configs` wird in `supabase_realtime` veröffentlicht. Der Kiosk
lädt die Vorlage beim Start und rendert sie bei jedem UPDATE erneut. Ist Realtime
nicht verfügbar, bleibt die zuletzt gültige Vorlage sichtbar. Die
Besucherauswahl ist weiter unabhängig davon und kommt über `kiosk_state`.

## Sicherheitsgrenzen

Der Client akzeptiert keine beliebigen HTML-Blöcke. Text wird als Textknoten
gesetzt, Bild-URLs werden als CSS/`img.src` behandelt und Video-URLs müssen HTTPS
verwenden. Das reduziert das Risiko, dass ein Admin-Inhalt zum Script-Injection-
Kanal wird.
