// visitor_panel: Bausteine für eine einzelne Besucher-Box.
// Genutzt von der Admin-Vorschau (eine Box) und von visitor-display.js (mehrere Boxen: Rotation/Stapel).

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

// Erzeugt eine leere Besucher-Box. Klassen statt IDs, damit mehrere Boxen gleichzeitig existieren können
// (Rotation: eine Box + Leiste; Stapel: eine Box pro Besucher). .visitor-box-progress ist die dezente
// Füllanimation der Rotation und bleibt sonst unsichtbar (width: 0).
export function createVisitorBox() {
    const box = document.createElement("div");
    box.className = "visitor-box";
    box.innerHTML = `
      <div class="visitor-box-progress"></div>
      <div class="logo-column">
        <div class="visitor-logo">Logo</div>
      </div>
      <p class="visitor-message">
        <span class="visitor-message-text">___</span>
      </p>`;
    return box;
}

// Füllt eine bestehende Box (aus createVisitorBox) mit Besucherdaten
export function fillVisitorBox(box, { name = "", imageUrl = "", template = "" } = {}) {
    const messageTarget = box.querySelector(".visitor-message-text");
    const logoEl = box.querySelector(".visitor-logo");
    const visitorName = String(name || "").trim();

    fillMessage(messageTarget, template, visitorName);

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

export function mountVisitorPanel(panel) {
    panel.replaceChildren(createVisitorBox());
}

// Einzel-Box direkt in einem Panel (Admin-Vorschau; im Kiosk übernimmt das visitor-display.js).
// alwaysVisible: Platzhalter auch ohne Name/Bild anzeigen (Admin-Vorschau); ohne das bleibt das Panel dann ausgeblendet.
export function renderVisitorPanel(panel, { name = "", imageUrl = "", template = "", alwaysVisible = false } = {}) {
    if (!panel) {
        return;
    }
    let box = panel.children.length === 1 ? panel.firstElementChild : null;
    if (!box || !box.classList.contains("visitor-box")) {
        box = createVisitorBox();
        panel.replaceChildren(box);
    }

    fillVisitorBox(box, { name, imageUrl, template });

    const hasContent = String(name || "").trim().length > 0 || Boolean(imageUrl);
    panel.hidden = !hasContent && !alwaysVisible;
}
