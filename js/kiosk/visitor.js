import { supabase as kioskSupabase, tableName as kioskTableName } from "../shared/supabase.js";

export function updateVisitorPanel() {
    const panel = document.getElementById("visitor-panel");
    const messageTarget = document.getElementById("visitor-message-placeholder");
    const companyEl = document.getElementById("company-logo");
    const visitorEl = document.getElementById("visitor-logo");

    const visitorMessage = String(window.visitorMessage || "").trim();
    const imageUrl = window.visitorImageUrl || "";
    const companyUrl = window.companyLogoUrl || "";

    if (!panel || !messageTarget) {
        return;
    }

    // Show panel when there is either a message or at least one logo/image
    const shouldShow = visitorMessage.length > 0 || imageUrl || companyUrl;
    if (shouldShow) {
        messageTarget.textContent = visitorMessage.length > 0 ? visitorMessage : "___";
        panel.hidden = false;
    } else {
        messageTarget.textContent = "___";
        panel.hidden = true;
    }

    if (companyEl) {
        if (companyUrl) {
            companyEl.style.backgroundImage = `url("${companyUrl}")`;
            companyEl.style.backgroundSize = "contain";
            companyEl.style.backgroundPosition = "center";
            companyEl.style.backgroundRepeat = "no-repeat";
            companyEl.textContent = "";
        } else {
            companyEl.style.backgroundImage = "none";
            companyEl.textContent = "Firma";
        }
    }

    if (visitorEl) {
        if (imageUrl) {
            visitorEl.style.backgroundImage = `url("${imageUrl}")`;
            visitorEl.style.backgroundSize = "contain";
            visitorEl.style.backgroundPosition = "center";
            visitorEl.style.backgroundRepeat = "no-repeat";
            visitorEl.style.color = "transparent";
            visitorEl.textContent = "";
        } else {
            visitorEl.style.backgroundImage = "none";
            visitorEl.style.color = "#0067b9";
            visitorEl.textContent = "Logo";
        }
    }
}

export async function loadVisitorProfile() {
    if (!kioskSupabase) {
        // fallback for local testing
        window.visitorMessage = "Max Mustermann";
        window.visitorImageUrl = "";
        window.companyLogoUrl = "";
        updateVisitorPanel();
        return;
    }

    try {
        const { data, error } = await kioskSupabase
            .from(kioskTableName)
            .select("visitor_message, image_url")
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (data) {
            // Prefer new `visitor_message`
            window.visitorMessage = data.visitor_message || "";
            window.visitorImageUrl = data.image_url || "";
            // companyLogoUrl is optional and not stored in this table by default
            window.companyLogoUrl = window.companyLogoUrl || "";
        } else {
            window.visitorMessage = "";
            window.visitorImageUrl = "";
            window.companyLogoUrl = "";
        }
    } catch (error) {
        console.warn("Visitor profile load failed:", error.message || error);
        window.visitorMessage = "";
        window.visitorImageUrl = "";
        window.companyLogoUrl = "";
    }

    updateVisitorPanel();
}

export function setVisitorMessage(text) {
    window.visitorMessage = String(text || '').trim();
    updateVisitorPanel();
}

// backward compatibility
export function setVisitorName(name) {
    setVisitorMessage(name);
}