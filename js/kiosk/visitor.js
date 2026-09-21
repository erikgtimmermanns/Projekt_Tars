import { supabase as kioskSupabase, tableName as kioskTableName } from "../shared/supabase.js";
import { renderVisitorPanel } from "../shared/visitor-panel.js";
import { getTodayIso } from "../shared/visit-dates.js";

export function updateVisitorPanel() {
    renderVisitorPanel(document.getElementById("visitor-panel"), {
        name: window.visitorName,
        imageUrl: window.visitorImageUrl,
        template: window.visitorTemplate
    });
}

export async function loadVisitorProfile() {
    if (!kioskSupabase) {
        // fallback for local testing
        window.visitorName = "";
        window.visitorImageUrl = "";
        window.visitorTemplate = "";
        updateVisitorPanel();
        return;
    }

    try {
            const { data, error } = await kioskSupabase
                .from(kioskTableName)
                .select("visitor_name, image_url, visitor_templates(message)")
            .contains("visit_date", [getTodayIso()]) // nur Besucher, die heute zu Besuch sind
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (data) {
            // Load visitor_name (single source of truth)
                window.visitorName = data.visitor_name || "";
                window.visitorImageUrl = data.image_url || "";
                window.visitorTemplate = data.visitor_templates?.message || "";
        } else {
            window.visitorName = "";
            window.visitorImageUrl = "";
            window.visitorTemplate = "";
        }
    } catch (error) {
        // Anzeige bleibt bei einem Netzwerkfehler unverändert, sonst verschwindet der Besucher bis zum nächsten Abruf
        console.warn("Visitor profile load failed:", error.message || error);
        return;
    }

    updateVisitorPanel();
}

export function setvisitorName(text) {
    window.visitorName = String(text || '').trim();
    updateVisitorPanel();
}

// backward compatibility
export function setVisitorName(name) {
    setvisitorName(name);
}