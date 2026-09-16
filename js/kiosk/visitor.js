export function updateVisitorPanel() {
    const panel = document.getElementById("visitor-panel");
    const nameTarget = document.getElementById("visitor-name-placeholder");
    if (!panel || !nameTarget) return;

    const visitorName = String(window.visitorName || "").trim();

    if (visitorName.length > 0) {
        nameTarget.textContent = visitorName;
        panel.hidden = false;
    } else {
        nameTarget.textContent = "___";
        panel.hidden = true;
    }
}

export function setVisitorName(name) {
    window.visitorName = String(name || "").trim();
    updateVisitorPanel();
}
