import { supabase as kioskSupabase, tableName as kioskTableName } from "../shared/supabase.js";

export function updateVisitorPanel() {
    const panel = document.getElementById("visitor-panel");
    const messageTarget = document.getElementById("visitor-message-placeholder");
    const visitorEl = document.getElementById("visitor-logo");

    const visitorName = String(window.visitorName || "").trim();
    const welcomeMessage = visitorName ? `Wir freuen uns heute, ${visitorName} in unserer Geschäftsstelle Düsseldorf begrüßen zu dürfen.` : "";
    
    const imageUrl = window.visitorImageUrl || "";
    const companyUrl = window.companyLogoUrl || "";

    if (!panel || !messageTarget) {
        return;
    }

    // Show panel when there is either a message or at least one logo/image
    const shouldShow = visitorName.length > 0 || imageUrl;
    if (shouldShow) {
        messageTarget.textContent = visitorName.length > 0 ? welcomeMessage : "___";
        panel.hidden = false;
    } else {
        messageTarget.textContent = "___";
        panel.hidden = true;
    }


    if (visitorEl) {
        if (imageUrl) {
            visitorEl.style.backgroundImage = `url("${imageUrl}")`;
            visitorEl.style.backgroundSize = "contain";
            visitorEl.style.backgroundPosition = "center";
            visitorEl.style.backgroundRepeat = "no-repeat";
            visitorEl.style.color = "transparent";
            visitorEl.textContent = "+";
        } else {
            visitorEl.style.backgroundImage = "none";
            visitorEl.style.color = "#0a0a0a";
            visitorEl.textContent = "Logo";
        }
    }
}

export async function loadVisitorProfile() {
    if (!kioskSupabase) {
        // fallback for local testing
        window.visitorName = "";
        window.visitorImageUrl = "";
        window.companyLogoUrl = "";
        updateVisitorPanel();
        return;
    }

    try {
            const { data, error } = await kioskSupabase
                .from(kioskTableName)
                .select("visitor_name, company_logo_url")
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (data) {
            // Load visitor_name (single source of truth)
                window.visitorName = data.visitor_name || "";
                window.companyLogoUrl = data.company_logo_url || window.companyLogoUrl || "";
        } else {
            window.visitorName = "";
            window.companyLogoUrl = "";
        }
    } catch (error) {
        console.warn("Visitor profile load failed:", error.message || error);
        window.visitorName = "";
        window.visitorImageUrl = "";
        window.companyLogoUrl = "";
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