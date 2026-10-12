const STATE_TABLE = "kiosk_state";

function normalize(row) {
    const state = row?.state === 1 ? 1 : 0;
    return state;
}


export async function fetchKioskState(supabase) {
    if(!supabase) return normalize(null);
    try {
        const { data, error } = await supabase
            .from(STATE_TABLE)
            .select("state")
            .eq("id", 1)
            .maybeSingle();
        if (error || !data) return normalize(null);
        return normalize(data);
    } catch (error) {
        console.warn("Kiosk-State konnte nicht geladen werden:", error.message || error);
        return normalize(null);
    }
}


export function subscribeKioskState(supabase, onChange) {
    fetchKioskState(supabase).then(onChange);

    if (!supabase) {
        return () => {};
    }

    const channel = supabase
        .channel("kiosk_state_changes")
        .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: STATE_TABLE, filter: "id=eq.1" },
            (payload) => onChange(normalize(payload.new))
        )
        .subscribe();
    console.log("channel kiosk_state:", channel)
    console.log("onChange", onChange)

    return () => supabase.removeChannel(channel);
}