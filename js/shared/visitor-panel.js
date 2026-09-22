// visitor_panel: Markup und Rendering, gemeinsam genutzt von Kiosk und Admin-Vorschau

export function buildWelcomeMessage(name) {
    const visitorName = String(name || "").trim();
    return visitorName
        ? `Wir freuen uns heute, ${visitorName} in unserer Geschäftsstelle Düsseldorf begrüßen zu dürfen.`
        : "";
}

export function mountVisitorPanel(panel) {
    panel.innerHTML = `
      <div class="visitor-box">
        <div class="logo-column">
          <div class="visitor-logo" id="visitor-logo">Logo</div>
        </div>
        <p class="visitor-message">
          <span id="visitor-message-placeholder">___</span>
        </p>
      </div>`;
}

// alwaysVisible: Platzhalter auch ohne Name/Bild anzeigen (Admin-Vorschau); der Kiosk blendet das Panel dann aus
export function renderVisitorPanel(panel, { name = "", imageUrl = "", alwaysVisible = false } = {}) {
    if (!panel) {
        return;
    }
    if (!panel.querySelector(".visitor-box")) {
        mountVisitorPanel(panel);
    }

    const messageTarget = panel.querySelector("#visitor-message-placeholder");
    const logoEl = panel.querySelector("#visitor-logo");

    const visitorName = String(name || "").trim();
    const hasContent = visitorName.length > 0 || Boolean(imageUrl);

    messageTarget.textContent = visitorName ? buildWelcomeMessage(visitorName) : "___";
    panel.hidden = !hasContent && !alwaysVisible;

    if (imageUrl) {
        logoEl.style.backgroundImage = `url(${JSON.stringify(imageUrl)})`;
        logoEl.style.backgroundSize = "contain";
        logoEl.style.backgroundPosition = "center";
        logoEl.style.backgroundRepeat = "no-repeat";
        logoEl.style.color = "transparent";
        logoEl.textContent = "+";
    } else {
        logoEl.style.backgroundImage = "none";
        logoEl.style.color = "#0a0a0a";
        logoEl.textContent = "Logo";
    }
}
