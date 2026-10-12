export function createVisitorBtn(visitor = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "visitor-btn";

    const logo = document.createElement("div");
    logo.className = "visitor-logo";

    const nameEl = document.createElement("div");
    nameEl.className = "visitor-name-text";

    button.append(logo, nameEl);
    fillVisitorBtn(button, visitor);
    return button;
}

function fillVisitorBtn(button, { name = "", imageUrl = "" } = {}) {
    const logoEl = button.querySelector(".visitor-logo");
    const nameEl = button.querySelector(".visitor-name-text");

    if (!logoEl || !nameEl) return;

    nameEl.textContent = name || "Gast";

    if (imageUrl) {
        logoEl.style.backgroundImage = `url(${JSON.stringify(imageUrl)})`;
        logoEl.textContent = "";
    } else {
        logoEl.style.backgroundImage = "none";
        logoEl.textContent = "Logo";
    }
}