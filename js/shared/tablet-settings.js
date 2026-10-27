const STATE_TABLE = "kiosk_state";

export const KIOSK_VIEW_ALLIANCE_COMPARISON = "alliance-comparison";
export const KIOSK_VIEW_NASA_APOD = "nasa-apod";
export const KIOSK_VIEW_COUD_CHART = "coud-chart";
export const SEEKAMPF_STATISTICS_URL = "https://seekampf.de/statistik";
export const KIOSK_WIDGET_AUTO_CLOSE_MS = 5 * 60 * 1000;
export const COUD_CHART_RANGES = Object.freeze([
    { value: "1D", label: "1T" },
    { value: "1M", label: "1M" },
    { value: "3M", label: "3M" },
    { value: "12M", label: "1J" },
    { value: "60M", label: "5J" },
    { value: "ALL", label: "Alle" }
]);

const SELECTION_FIELDS = "selected_visitor_id, selected_visitor_at, selected_kiosk_view, selected_kiosk_chart_range, selected_kiosk_url, selected_kiosk_at";
let subscriptionSequence = 0;
let lastKioskControlError = "";

export function getLastKioskControlError() {
    return lastKioskControlError;
}

function normalizeKioskView(row) {
    if (row?.selected_kiosk_view === KIOSK_VIEW_ALLIANCE_COMPARISON) return KIOSK_VIEW_ALLIANCE_COMPARISON;
    if (row?.selected_kiosk_view === KIOSK_VIEW_NASA_APOD) return KIOSK_VIEW_NASA_APOD;
    if (row?.selected_kiosk_view === KIOSK_VIEW_COUD_CHART) return KIOSK_VIEW_COUD_CHART;
    // Kompatibilität mit dem Status vor der Widget-Ansichtsmigration.
    return row?.selected_kiosk_url === SEEKAMPF_STATISTICS_URL ? KIOSK_VIEW_ALLIANCE_COMPARISON : null;
}

function normalizeSelection(row) {
    return {
        visitorId: row?.selected_visitor_id == null ? null : String(row.selected_visitor_id),
        selectedAt: row?.selected_visitor_at || null,
        kioskView: normalizeKioskView(row),
        kioskViewAt: row?.selected_kiosk_at || null,
        chartRange: COUD_CHART_RANGES.some((range) => range.value === row?.selected_kiosk_chart_range)
            ? row.selected_kiosk_chart_range
            : "1D"
    };
}

export function getKioskViewAutoCloseDelay(kioskViewAt) {
    const openedAt = Date.parse(kioskViewAt || "");
    if (Number.isNaN(openedAt)) return KIOSK_WIDGET_AUTO_CLOSE_MS;
    return Math.max(0, KIOSK_WIDGET_AUTO_CLOSE_MS - (Date.now() - openedAt));
}

export async function fetchKioskSelection(supabase) {
    if (!supabase) return normalizeSelection(null);
    try {
        const { data, error } = await supabase
            .from(STATE_TABLE)
            .select(SELECTION_FIELDS)
            .eq("id", 1)
            .maybeSingle();
        if (error || !data) return normalizeSelection(null);
        return normalizeSelection(data);
    } catch (error) {
        console.warn("Kiosk-Besucherauswahl konnte nicht geladen werden:", error.message || error);
        return normalizeSelection(null);
    }
}

export async function setKioskSelection(supabase, visitorId) {
    if (!supabase) {
        return false;
    }

    const selected = visitorId == null ? null : String(visitorId);
    try {
        const { error } = await supabase.rpc("set_kiosk_visitor_selection", {
            p_visitor_id: selected
        });
        if (error) throw error;
        return true;
    } catch (error) {
        console.warn("Kiosk-Besucherauswahl konnte nicht gespeichert werden:", error.message || error);
        return false;
    }
}

export function subscribeKioskSelection(supabase, onChange) {
    if (!supabase) {
        onChange(normalizeSelection(null));
        return () => {};
    }

    let receivedRealtime = false;
    let initialFetchStarted = false;
    let realtimeAvailable = false;
    let disposed = false;
    const loadInitialSelection = () => {
        if (initialFetchStarted) return;
        initialFetchStarted = true;
        fetchKioskSelection(supabase).then((selection) => {
            if (!receivedRealtime) onChange(selection);
        });
    };
    const refreshWithoutRealtime = () => {
        fetchKioskSelection(supabase).then((selection) => {
            if (!disposed) onChange(selection);
        });
    };

    const channel = supabase
        .channel(`kiosk_state_changes_${++subscriptionSequence}`)
        .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: STATE_TABLE, filter: "id=eq.1" },
            (payload) => {
                receivedRealtime = true;
                realtimeAvailable = true;
                onChange(normalizeSelection(payload.new));
            }
        )
        .subscribe((status) => {
            if (status === "SUBSCRIBED") {
                realtimeAvailable = true;
                loadInitialSelection();
            } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
                realtimeAvailable = false;
                refreshWithoutRealtime();
            }
        });

    // Sicherheitsnetz für Kiosk-Installationen, deren Realtime-Verbindung
    // blockiert ist oder zwar verbunden wirkt, aber keine UPDATE-Ereignisse
    // ausliefert. Der Status besteht aus genau einer Datenbankzeile.
    const pollingTimer = window.setInterval(() => {
        refreshWithoutRealtime();
    }, 3000);

    return () => {
        disposed = true;
        window.clearInterval(pollingTimer);
        return supabase.removeChannel(channel);
    };
}

export async function setKioskViewSelection(supabase, view) {
    lastKioskControlError = "";
    if (!supabase) {
        lastKioskControlError = "Die Supabase-Verbindung ist nicht eingerichtet.";
        return false;
    }

    const selectedView = view == null ? null : String(view);
    if (selectedView !== null
        && selectedView !== KIOSK_VIEW_ALLIANCE_COMPARISON
        && selectedView !== KIOSK_VIEW_NASA_APOD
        && selectedView !== KIOSK_VIEW_COUD_CHART) {
        lastKioskControlError = "Die gewählte Kioskansicht ist ungültig.";
        return false;
    }

    try {
        const { error } = await supabase.rpc("set_kiosk_view_selection", {
            p_view: selectedView
        });
        if (error) throw error;
        return true;
    } catch (error) {
        lastKioskControlError = error.message || "Die Kioskansicht konnte nicht gespeichert werden.";
        console.warn("Kiosk-Ansicht konnte nicht gespeichert werden:", error.message || error);
        return false;
    }
}

export async function setKioskChartRange(supabase, range) {
    lastKioskControlError = "";
    if (!supabase) {
        lastKioskControlError = "Die Supabase-Verbindung ist nicht eingerichtet.";
        return false;
    }
    if (!COUD_CHART_RANGES.some((item) => item.value === range)) {
        lastKioskControlError = "Der gewählte Zeitraum ist ungültig.";
        return false;
    }

    try {
        const { error } = await supabase.rpc("set_kiosk_chart_range", { p_range: range });
        if (error) throw error;
        return true;
    } catch (error) {
        lastKioskControlError = error.message || "Der Chartzeitraum konnte nicht gespeichert werden.";
        console.warn("Kiosk-Chartzeitraum konnte nicht gespeichert werden:", error.message || error);
        return false;
    }
}
