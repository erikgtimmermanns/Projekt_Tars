// visitor_panel: Markup und Rendering, gemeinsam genutzt von Kiosk und Admin-Vorschau

// Standardtext für Besucher ohne Vorlage (template_id = null)
export const DEFAULT_TEMPLATE = "Wir freuen uns heute, {{Besuchername}} in unserer Geschäftsstelle Düsseldorf begrüßen zu dürfen.";

const NAME_PLACEHOLDER = /\{\{\s*Besuchername\s*\}\}/gi;

// Setzt die Vorlage aus Text- und Namensknoten zusammen; der Name wird nie als HTML interpretiert
function fillMessage(target, template, name) {
    let parts = String(template || DEFAULT_TEMPLATE).split(NAME_PLACEHOLDER);
    if (parts.length === 1) {
        parts = DEFAULT_TEMPLATE.split(NAME_PLACEHOLDER); // Vorlage ohne Platzhalter würde den Namen verschlucken
    }

    const nodes = [];
    parts.forEach((part, index) => {
        if (index > 0) {
            const nameEl = document.createElement("span");
            nameEl.className = "visitor-name";
            nameEl.textContent = name || "___";
            nodes.push(nameEl);
        }
        if (part) {
            nodes.push(document.createTextNode(part));
        }
    });
    target.replaceChildren(...nodes);
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
export function renderVisitorPanel(panel, { name = "", imageUrl = "", template = "", alwaysVisible = false } = {}) {
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

    fillMessage(messageTarget, template, visitorName);
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
