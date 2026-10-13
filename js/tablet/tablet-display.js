import { createVisitorBtn } from "./tablet-btn.js";
import { supabase } from "../shared/supabase.js";
import { setKioskSelection, subscribeKioskSelection } from "../shared/tablet-settings.js";

let display = null;
let selectionUnsubscribe = null;
let selectedVisitorId = null;
let selectionRequest = 0;

function showSelectionStatus(message, isError = false) {
    const status = document.getElementById("selection-status");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("error", isError);
    status.hidden = false;
    window.clearTimeout(showSelectionStatus.timeout);
    showSelectionStatus.timeout = window.setTimeout(() => {
        status.hidden = true;
    }, isError ? 8000 : 2500);
}

function updateSelectedButtons(panel) {
    panel.querySelectorAll(".visitor-btn[data-visitor-id]").forEach((button) => {
        const selected = button.dataset.visitorId === selectedVisitorId;
        button.setAttribute("aria-pressed", String(selected));
    });
}

export function initTabletSelection() {
    const panel = document.getElementById("visitor-btn-panel");
    if (!panel || selectionUnsubscribe) return;

    panel.addEventListener("click", (event) => {
        const button = event.target.closest(".visitor-btn[data-visitor-id]");
        if (!button || !panel.contains(button)) return;
        const visitorId = button.dataset.visitorId;
        const previousVisitorId = selectedVisitorId;
        const nextVisitorId = visitorId === previousVisitorId ? null : visitorId;
        const request = ++selectionRequest;
        selectedVisitorId = nextVisitorId;
        updateSelectedButtons(panel);
        showSelectionStatus(nextVisitorId ? "Besucher wird angezeigt ..." : "Begrüßung wird geschlossen ...");

        void setKioskSelection(supabase, nextVisitorId).then((success) => {
            if (request !== selectionRequest) return;
            if (success) {
                showSelectionStatus(nextVisitorId ? "Besucher am Empfangsbildschirm aktiviert." : "Begrüßung geschlossen.");
                return;
            }
            selectedVisitorId = previousVisitorId;
            updateSelectedButtons(panel);
            showSelectionStatus("Übertragung fehlgeschlagen. Supabase-Migration und Verbindung prüfen.", true);
        });
    });

    selectionUnsubscribe = subscribeKioskSelection(supabase, (selection) => {
        selectionRequest++;
        selectedVisitorId = selection.visitorId;
        updateSelectedButtons(panel);
    });
}

function getDisplay() {
    if (!display) {
        const panel = document.getElementById("visitor-btn-panel");
        if (!panel) return null;
        display = createTabletDisplay(panel);
    }
    return display;
}

export function createTabletDisplay(panel) {
    function renderEmpty() {
        panel.hidden = true;
        panel.replaceChildren();
    }

    function renderSingle(visitor) {
        panel.hidden = false;
        const button = createVisitorBtn(visitor);
        panel.replaceChildren(button);
        updateSelectedButtons(panel);
    }

    function renderStack(list) {
        console.log("renderStack")
        panel.hidden = false;
        const root = document.createElement("div");
        root.className = "visitor-stack";

        list.forEach((visitor) => {
            root.appendChild(createVisitorBtn(visitor));
        });

        panel.replaceChildren(root);
        updateSelectedButtons(panel);
    }

    function update_btn(newVisitors) {
        const list = Array.isArray(newVisitors) ? newVisitors : [];
        console.log("list is:", newVisitors)
        console.log("list length", list.length)

        if (list.length === 0) {
            renderEmpty();
            return;
        }

        if (list.length === 1) {
            renderSingle(list[0]);
            return;
        }

        renderStack(list);
    }

    return { update_btn };
}

export function updateVisitorBtnPanel(visitors = []) {
    const activeDisplay = getDisplay();
    if (activeDisplay) {
        activeDisplay.update_btn(visitors);
    }
}