// Globale Kiosk-Einstellung (nicht an einen Benutzer gebunden): eine Zeile in kiosk_settings, id = 1.
import { VISITOR_ROTATE_DEFAULT_S } from "./config.js";

const SETTINGS_TABLE = "kiosk_settings";
export const DEFAULT_DISPLAY_MODE = "rotate";
export const DEFAULT_ROTATE_INTERVAL_MS = VISITOR_ROTATE_DEFAULT_S * 1000;

const MIN_ROTATE_INTERVAL_S = 2;
const MAX_ROTATE_INTERVAL_S = 60;

function normalize(row) {
    const mode = row?.display_mode === "stack" ? "stack" : DEFAULT_DISPLAY_MODE;

    let seconds = Number(row?.rotate_interval_seconds);
    if (!Number.isFinite(seconds)) {
        seconds = DEFAULT_ROTATE_INTERVAL_MS / 1000;
    }
    seconds = Math.min(MAX_ROTATE_INTERVAL_S, Math.max(MIN_ROTATE_INTERVAL_S, seconds));

    return { mode, rotateIntervalMs: seconds * 1000 };
}

export async function fetchKioskSettings(supabase) {
    if (!supabase) return normalize(null);
    try {
        const { data, error } = await supabase
            .from(SETTINGS_TABLE)
            .select("display_mode, rotate_interval_seconds")
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
    fetchKioskSettings(supabase).then(onChange);

    if (!supabase) {
        return () => {};
    }

    const channel = supabase
        .channel("kiosk_settings_changes")
        .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: SETTINGS_TABLE, filter: "id=eq.1" },
            (payload) => onChange(normalize(payload.new))
        )
        .subscribe();

    return () => supabase.removeChannel(channel);
}
