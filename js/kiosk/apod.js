function trimExplanation(value, maxLength = 420) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trimEnd()} …`;
}

function formatApodDate(value) {
    const date = new Date(`${value}T12:00:00Z`);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(date);
}

let apodRequest = null;

export async function loadApod() {
    if (apodRequest) return apodRequest;

    apodRequest = (async () => {
        const response = await fetch("/api/nasa/apod", { cache: "no-store" });
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            throw new Error("API-Server fehlt. Bitte im Projektordner `npm start` ausführen und die Seite über Port 4173 öffnen.");
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
        if (!data.imageUrl) throw new Error("NASA lieferte kein anzeigbares Bild.");
        return data;
    })();

    try {
        return await apodRequest;
    } catch (error) {
        apodRequest = null;
        throw error;
    }
}

export function renderApod(panel, data, { full = false } = {}) {
    const image = panel.querySelector("[data-apod-image]");
    const title = panel.querySelector("[data-apod-title]");
    const explanation = panel.querySelector("[data-apod-explanation]");
    const meta = panel.querySelector("[data-apod-meta]");
    const status = panel.querySelector("[data-apod-status]");
    const content = panel.querySelector(".nasa-apod-content");
    if (!image || !title || !explanation || !meta || !status || !content) return;

    image.src = data.imageUrl;
    image.alt = data.alt || data.title || "NASA Astronomy Picture of the Day";
    title.textContent = data.title || "NASA Picture of the Day";
    explanation.textContent = full ? String(data.explanation || "") : trimExplanation(data.explanation);
    const credit = data.copyright || data.credit;
    meta.textContent = [formatApodDate(data.date), credit ? `© ${credit}` : "NASA"].filter(Boolean).join(" · ");
    content.hidden = false;
    status.classList.remove("error");
    status.hidden = !data.stale;
    status.textContent = data.stale ? "NASA ist gerade nicht erreichbar; zuletzt geladenes Bild wird gezeigt." : "";
}

export function renderApodError(panel, error) {
    const status = panel.querySelector("[data-apod-status]");
    const content = panel.querySelector(".nasa-apod-content");
    if (content) content.hidden = true;
    if (status) {
        status.hidden = false;
        status.classList.add("error");
        status.textContent = error?.message || "NASA Picture of the Day konnte nicht geladen werden.";
    }
}
