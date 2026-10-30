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

## Umgesetzt

- Admin-Arbeitsfläche über die volle Breite statt einer eingequetschten
  Unteransicht neben einer leeren Vorschau.
- Drag & Drop, Raster-Snapping, Auswahl, Größenänderung, Duplizieren sowie
  Undo/Redo (auch über Strg/Cmd+Z und Strg/Cmd+Y).
- Echte Kiosk-Vorschau mit Display-/Tablet-Größe und Musterbesucher.
- Bild-Upload und Medienbibliothek für bereits hochgeladene Overlay-Bilder.
- Getrennte Entwurfs- und veröffentlichte Vorlage. Der Kiosk liest nur die
  veröffentlichte Version; Entwürfe können gefahrlos gespeichert werden.
- Wahl zwischen globalem Standardoverlay und einem bestimmten Besucher. Eine
  Besucherzuordnung übersteuert das Standardlayout nur für diesen Besucher;
  ohne Zuordnung bleibt der globale Stand aktiv.
- Versionshistorie: Jede Veröffentlichung wird gespeichert; alte Versionen
  lassen sich zunächst als Entwurf wiederherstellen.

Die vorhandene Authentifizierung bleibt bewusst das Berechtigungsmodell:
angemeldete Admins dürfen das Overlay bearbeiten, wie sie auch Besucher und
Kiosk-Einstellungen bearbeiten. Eine separate Rollenverwaltung würde eine
übergreifende Benutzerverwaltung erfordern und ist kein stillschweigend
hinzugefügtes Sicherheitsmodell.

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
