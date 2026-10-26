// Globale Kiosk-Einstellung (nicht an einen Benutzer gebunden): eine Zeile in kiosk_settings, id = 1.
import { VISITOR_ROTATE_DEFAULT_S } from "./config.js";

export const SETTINGS_TABLE = "kiosk_settings";
const STATE_TABLE = "kiosk_state";
let subscriptionSequence = 0;

export const DEFAULT_DISPLAY_MODE = "rotate";
export const DEFAULT_ROTATE_INTERVAL_MS = VISITOR_ROTATE_DEFAULT_S * 1000;
export const DEFAULT_HEADER_LANGUAGE = "de";
export const DEFAULT_WIDGET_ROTATE_INTERVAL_MS = 15 * 1000;

const MIN_ROTATE_INTERVAL_S = 2;
const MAX_ROTATE_INTERVAL_S = 60;
const MIN_WIDGET_ROTATE_INTERVAL_S = 5;
const MAX_WIDGET_ROTATE_INTERVAL_S = 120;

function normalize(row) {
    const mode = row?.display_mode === "stack" ? "stack" : DEFAULT_DISPLAY_MODE;

    let seconds = Number(row?.rotate_interval_seconds);
    if (!Number.isFinite(seconds)) {
        seconds = DEFAULT_ROTATE_INTERVAL_MS / 1000;
    }
    seconds = Math.min(MAX_ROTATE_INTERVAL_S, Math.max(MIN_ROTATE_INTERVAL_S, seconds));

    let widgetSeconds = Number(row?.widget_rotate_interval_seconds);
    if (!Number.isFinite(widgetSeconds)) {
        widgetSeconds = DEFAULT_WIDGET_ROTATE_INTERVAL_MS / 1000;
    }
    widgetSeconds = Math.min(MAX_WIDGET_ROTATE_INTERVAL_S, Math.max(MIN_WIDGET_ROTATE_INTERVAL_S, widgetSeconds));

    const headerLanguage = row?.header_language === "en" ? "en" : DEFAULT_HEADER_LANGUAGE;
    // seekampf_pinned bleibt nur als Fallback für Datenbanken ohne die Widget-Migration erhalten.
    const seekampfEnabled = row?.seekampf_enabled === true
        || (row?.seekampf_enabled == null && row?.seekampf_pinned === true);
    return {
        mode,
        rotateIntervalMs: seconds * 1000,
        seekampfEnabled,
        nasaApodEnabled: row?.nasa_apod_enabled === true,
        widgetRotateIntervalMs: widgetSeconds * 1000,
        headerLanguage
    };
}

export async function fetchKioskSettings(supabase) {
    if (!supabase) return normalize(null);
    try {
        const { data, error } = await supabase
            .from(SETTINGS_TABLE)
            .select("display_mode, rotate_interval_seconds, seekampf_pinned, seekampf_enabled, nasa_apod_enabled, widget_rotate_interval_seconds, header_language")
            .eq("id", 1)
            .maybeSingle();
        if (error || !data) return normalize(null);
        return normalize(data);
    } catch (error) {
        console.warn("Kiosk-Einstellung konnte nicht geladen werden:", error.message || error);
        return normalize(null);
    }
}

// Ruft onChange sofort mit der aktuellen Einstellung auf und danach bei jeder Änderung in Echtzeit.
// Gibt eine Funktion zurück, die das Abo wieder beendet.
export function subscribeKioskSettings(supabase, onChange) {
    // fetched kiosk settings von supabase: Table: "SETTINGS_TABLE"
    // 'then' also dann ruft es "normalize" über 'function fetchKioskSettings()' auf:
    // display mode und rotate interval wird gesetzt
    fetchKioskSettings(supabase).then(onChange);

    if (!supabase) {
        return () => {};
    }

    const channel = supabase
        .channel(`kiosk_settings_changes_${++subscriptionSequence}`)
        .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: SETTINGS_TABLE, filter: "id=eq.1" },
            (payload) => onChange(normalize(payload.new))
        )
        .subscribe((status, error) => {
            if (status === "SUBSCRIBED") {
                console.info("Kiosk-Einstellungen werden live über Supabase aktualisiert.");
            } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
                console.warn("Supabase-Realtime für kiosk_settings ist nicht verfügbar:", status, error);
            }
        });

    return () => supabase.removeChannel(channel);
}
