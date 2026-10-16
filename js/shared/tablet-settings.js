const STATE_TABLE = "kiosk_state";

export const KIOSK_VIEW_ALLIANCE_COMPARISON = "alliance-comparison";
export const SEEKAMPF_STATISTICS_URL = "https://seekampf.de/statistik";

const SELECTION_FIELDS = "selected_visitor_id, selected_visitor_at, selected_kiosk_url, selected_kiosk_at";
let subscriptionSequence = 0;

function normalizeSelection(row) {
    return {
        visitorId: row?.selected_visitor_id == null ? null : String(row.selected_visitor_id),
        selectedAt: row?.selected_visitor_at || null,
        kioskView: row?.selected_kiosk_url === SEEKAMPF_STATISTICS_URL ? KIOSK_VIEW_ALLIANCE_COMPARISON : null,
        kioskViewAt: row?.selected_kiosk_at || null
    };
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
    const loadInitialSelection = () => {
        if (initialFetchStarted) return;
        initialFetchStarted = true;
        fetchKioskSelection(supabase).then((selection) => {
            if (!receivedRealtime) onChange(selection);
        });
    };

    const channel = supabase
        .channel(`kiosk_state_changes_${++subscriptionSequence}`)
        .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: STATE_TABLE, filter: "id=eq.1" },
            (payload) => {
                receivedRealtime = true;
                onChange(normalizeSelection(payload.new));
            }
        )
        .subscribe((status) => {
            if (status === "SUBSCRIBED") loadInitialSelection();
        });

    return () => supabase.removeChannel(channel);
}

export async function setKioskViewSelection(supabase, view) {
    if (!supabase) return false;

    const selectedView = view == null ? null : String(view);
    if (selectedView !== null && selectedView !== KIOSK_VIEW_ALLIANCE_COMPARISON) return false;

    try {
        const { error } = await supabase.rpc("set_kiosk_url_selection", {
            p_url: selectedView === KIOSK_VIEW_ALLIANCE_COMPARISON ? SEEKAMPF_STATISTICS_URL : null
        });
        if (error) throw error;
        return true;
    } catch (error) {
        console.warn("Kiosk-Ansicht konnte nicht gespeichert werden:", error.message || error);
        return false;
    }
}