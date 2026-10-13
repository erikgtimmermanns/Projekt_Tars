import { supabase } from "../shared/supabase.js";
import { subscribeKioskSelection, setKioskSelection } from "../shared/tablet-settings.js";
import { createVisitorBox, fillVisitorBox } from "../shared/visitor-panel.js";

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

    const box = card.firstElementChild?.classList.contains("visitor-box")
        ? card.firstElementChild
        : createVisitorBox();
    fillVisitorBox(box, { ...visitor, template: "Hallo, {{Besuchername}}." });

    let videoPlaceholder = box.querySelector(".visitor-video-placeholder");
    if (!videoPlaceholder) {
        videoPlaceholder = document.createElement("div");
        videoPlaceholder.className = "visitor-video-placeholder";
        videoPlaceholder.setAttribute("role", "img");
        videoPlaceholder.setAttribute("aria-label", "Videoplatzhalter für den Weg zum Besucherraum");
        box.appendChild(videoPlaceholder);
    }
    card.replaceChildren(box);
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