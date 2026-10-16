import { supabase } from "../shared/supabase.js";
import { subscribeKioskSelection, setKioskSelection } from "../shared/tablet-settings.js";

const WELCOME_TIMEOUT_MS = 60 * 1000;

let overlay;
let card;
let visitors = [];
let visitorsLoaded = false;
let selectedVisitorId = null;
let selectedAt = null;
let timeout = null;

function renderWelcome() {
    if (!overlay || !card) return;
    const visitor = visitors.find((item) => String(item.id) === selectedVisitorId);
    overlay.hidden = !visitor;
    overlay.setAttribute("aria-hidden", visitor ? "false" : "true");
    if (!visitor) {
        card.replaceChildren();
        return;
    }

    const frame = document.createElement("iframe");
    frame.className = "visitor-welcome-frame";
    frame.title = "YouTube-Video für Besucher";
    frame.src = "https://www.youtube.com/embed/wSGoUSwNb44?autoplay=1&mute=1&playsinline=1&controls=1&rel=0";
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.allowFullscreen = true;
    frame.loading = "eager";
    frame.referrerPolicy = "strict-origin-when-cross-origin";

    const header = document.createElement("header");
    header.className = "visitor-welcome-header";

    const logo = document.createElement("div");
    logo.className = "visitor-welcome-logo";
    if (visitor.imageUrl) {
        logo.style.backgroundImage = `url(${JSON.stringify(visitor.imageUrl)})`;
        logo.setAttribute("aria-label", `Logo ${visitor.name || "des Besuchers"}`);
    } else {
        logo.textContent = "Logo";
    }

    const message = document.createElement("p");
    message.className = "visitor-welcome-message";
    message.append(document.createTextNode("Hallo, "));
    const name = document.createElement("strong");
    name.textContent = visitor.name || "Besucher";
    message.append(name, document.createTextNode("."));

    header.append(logo, message);
    const frameArea = document.createElement("div");
    frameArea.className = "visitor-welcome-frame-area";
    frameArea.append(frame);
    card.replaceChildren(header, frameArea);
}

function applySelection(selection) {
    window.clearTimeout(timeout);
    selectedVisitorId = selection.visitorId;
    selectedAt = selection.selectedAt;
    renderWelcome();

    if (!selectedVisitorId) return;

    const selectedTime = Date.parse(selectedAt) || Date.now();
    const remainingMs = selectedTime + WELCOME_TIMEOUT_MS - Date.now();
    if (remainingMs <= 0) {
        selectedVisitorId = null;
        selectedAt = null;
        renderWelcome();
        void setKioskSelection(supabase, null);
        return;
    }

    timeout = window.setTimeout(() => {
        if (selectedVisitorId === selection.visitorId && selectedAt === selection.selectedAt) {
            selectedVisitorId = null;
            selectedAt = null;
            renderWelcome();
            void setKioskSelection(supabase, null);
        }
    }, remainingMs);

    if (visitorsLoaded && !visitors.some((item) => String(item.id) === selectedVisitorId)) {
        window.clearTimeout(timeout);
        timeout = null;
        selectedVisitorId = null;
        selectedAt = null;
        renderWelcome();
        void setKioskSelection(supabase, null);
    }
}

export function setVisitorWelcomeVisitors(nextVisitors) {
    visitors = Array.isArray(nextVisitors) ? nextVisitors : [];
    visitorsLoaded = true;
    renderWelcome();
    if (selectedVisitorId && !visitors.some((item) => String(item.id) === selectedVisitorId)) {
        applySelection({ visitorId: selectedVisitorId, selectedAt });
    }
}

export function initVisitorWelcome() {
    overlay = document.getElementById("visitor-welcome-overlay");
    card = document.getElementById("visitor-welcome-card");
    if (!overlay || !card) return () => {};

    const unsubscribe = subscribeKioskSelection(supabase, applySelection);
    return () => {
        unsubscribe();
        window.clearTimeout(timeout);
    };
}
