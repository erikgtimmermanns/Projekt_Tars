function updateVisitorPanel() {
    const panel = document.getElementById("visitor-panel");
    const nameTarget = document.getElementById("visitor-name-placeholder");
    const logoBox = document.querySelector(".visitor-logo");
    const imageUrl = window.visitorImageUrl || "";
    const nameValue = (window.visitorName || "").trim();

    if (!panel || !nameTarget) {
        return;
    }

    if (nameValue.length > 0) {
        nameTarget.textContent = nameValue;
        panel.hidden = false;
    } else {
        nameTarget.textContent = "___";
        panel.hidden = true;
    }

    if (logoBox) {
        if (imageUrl) {
            logoBox.style.backgroundImage = `url("${imageUrl}")`;
            logoBox.style.backgroundSize = "cover";
            logoBox.style.backgroundPosition = "center";
            logoBox.style.color = "transparent";
            logoBox.textContent = "";
        } else {
            logoBox.style.backgroundImage = "none";
            logoBox.style.color = "#0067b9";
            logoBox.textContent = "Logo";
        }
    }
}

export async function loadVisitorProfile() {
    if (!window.kioskSupabase) {
        window.visitorName = "Max Mustermann";
        window.visitorImageUrl = "";
        updateVisitorPanel();
        return;
    }

    try {
        const { data, error } = await window.kioskSupabase
            .from(window.kioskTableName)
            .select("visitor_name, image_url")
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (data && data.visitor_name) {
            window.visitorName = data.visitor_name;
            window.visitorImageUrl = data.image_url || "";
        } else {
            window.visitorName = "";
            window.visitorImageUrl = "";
        }
    } catch (error) {
        console.warn("Visitor profile load failed:", error.message || error);
        window.visitorName = "";
        window.visitorImageUrl = "";
    }

    updateVisitorPanel();
}