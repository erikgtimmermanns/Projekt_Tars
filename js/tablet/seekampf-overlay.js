import { supabase } from "../shared/supabase.js";
import {
    KIOSK_VIEW_ALLIANCE_COMPARISON,
    setKioskViewSelection,
    subscribeKioskSelection
} from "../shared/tablet-settings.js";

let selectionStatusTimeout = null;

function showSelectionStatus(message, isError = false) {
    const status = document.getElementById("selection-status");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("error", isError);
    status.hidden = false;
    window.clearTimeout(selectionStatusTimeout);
    selectionStatusTimeout = window.setTimeout(() => {
        status.hidden = true;
    }, isError ? 8000 : 2500);
}

export function initSeekampfTabletButton() {
    const trigger = document.getElementById("seekampf-open");
    if (!trigger) return;

    let isActive = false;
    let isPending = false;
    trigger.setAttribute("aria-pressed", "false");

    const unsubscribe = subscribeKioskSelection(supabase, (selection) => {
        const wasActive = isActive;
        isActive = selection.kioskView === KIOSK_VIEW_ALLIANCE_COMPARISON;
        trigger.setAttribute("aria-pressed", String(isActive));
        if (wasActive !== isActive) {
            showSelectionStatus(isActive ? "Allianzstatistik am Empfangsbildschirm geöffnet." : "Statistik geschlossen.");
        }
    });

    trigger.addEventListener("click", async () => {
        if (isPending) return;
        isPending = true;
        trigger.disabled = true;

        const nextView = isActive ? null : KIOSK_VIEW_ALLIANCE_COMPARISON;
        showSelectionStatus(
            nextView ? "Allianzstatistik wird am Empfangsbildschirm geöffnet ..." : "Statistik wird geschlossen ..."
        );

        const saved = await setKioskViewSelection(supabase, nextView);
        isPending = false;
        trigger.disabled = false;

        if (saved) {
            showSelectionStatus(nextView ? "Allianzstatistik wird am Empfangsbildschirm angezeigt." : "Statistik geschlossen.");
        } else {
            showSelectionStatus("Übertragung fehlgeschlagen. Supabase-Migration und Verbindung prüfen.", true);
        }
    });

    return unsubscribe;
}