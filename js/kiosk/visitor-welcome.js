import { supabase } from "../shared/supabase.js";
import { subscribeKioskSelection, setKioskSelection } from "../shared/tablet-settings.js";
import { DEFAULT_VISITOR_OVERLAY_LAYOUT, fetchVisitorOverlayLayout, fetchVisitorOverlayLayoutForVisitor, renderVisitorOverlay, subscribeVisitorOverlayAssignments, subscribeVisitorOverlayLayout } from "../shared/visitor-overlay.js";

const WELCOME_TIMEOUT_MS = 60 * 1000;

let overlay;
let card;
let visitors = [];
let visitorsLoaded = false;
let selectedVisitorId = null;
let selectedAt = null;
let timeout = null;
let globalOverlayLayout = DEFAULT_VISITOR_OVERLAY_LAYOUT;
let overlayLayout = DEFAULT_VISITOR_OVERLAY_LAYOUT;
let overlayLayoutRequest = 0;

async function refreshOverlayForSelectedVisitor() {
    const visitorId = selectedVisitorId;
    const request = ++overlayLayoutRequest;
    if (!visitorId) {
        overlayLayout = globalOverlayLayout;
        renderWelcome();
        return;
    }
    const layout = await fetchVisitorOverlayLayoutForVisitor(supabase, visitorId, globalOverlayLayout);
    if (request !== overlayLayoutRequest || visitorId !== selectedVisitorId) return;
    overlayLayout = layout;
    renderWelcome();
}

function renderWelcome() {
    if (!overlay || !card) return;
    const visitor = visitors.find((item) => String(item.id) === selectedVisitorId);
    overlay.hidden = !visitor;
    overlay.setAttribute("aria-hidden", visitor ? "false" : "true");
    if (!visitor) {
        card.replaceChildren();
        return;
    }

    renderVisitorOverlay(card, overlayLayout, visitor);
}

function applySelection(selection) {
    window.clearTimeout(timeout);
    selectedVisitorId = selection.visitorId;
    selectedAt = selection.selectedAt;
    renderWelcome();
    void refreshOverlayForSelectedVisitor();

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

    void fetchVisitorOverlayLayout(supabase)
        .then((layout) => {
            globalOverlayLayout = layout;
            void refreshOverlayForSelectedVisitor();
        })
        .catch((error) => console.warn("Besucher-Overlay konnte nicht geladen werden:", error.message || error));
    const unsubscribeSelection = subscribeKioskSelection(supabase, applySelection);
    const unsubscribeOverlay = subscribeVisitorOverlayLayout(supabase, (layout) => {
        globalOverlayLayout = layout;
        void refreshOverlayForSelectedVisitor();
    });
    const unsubscribeAssignments = subscribeVisitorOverlayAssignments(supabase, ({ visitorId }) => {
        if (visitorId === selectedVisitorId) void refreshOverlayForSelectedVisitor();
    });
    return () => {
        unsubscribeSelection();
        unsubscribeOverlay();
        unsubscribeAssignments();
        window.clearTimeout(timeout);
    };
}
