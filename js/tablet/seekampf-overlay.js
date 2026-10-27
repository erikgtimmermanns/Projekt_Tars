import { supabase } from "../shared/supabase.js";
import { subscribeKioskSettings } from "../shared/kiosk-settings.js";
import {
    KIOSK_VIEW_ALLIANCE_COMPARISON,
    KIOSK_VIEW_NASA_APOD,
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

function labelForView(view) {
    return view === KIOSK_VIEW_NASA_APOD ? "NASA Picture of the Day" : "Allianzstatistik";
}

export function initWidgetTabletButtons() {
    const tools = document.querySelector(".tablet-tools");
    const triggers = [...document.querySelectorAll("[data-kiosk-view]")];
    if (!tools || !triggers.length) return () => {};

    let activeView = null;
    let isPending = false;
    let settings = { seekampfEnabled: false, nasaApodEnabled: false };

    const setButtons = () => {
        triggers.forEach((trigger) => {
            const view = trigger.dataset.kioskView;
            const enabled = view === KIOSK_VIEW_ALLIANCE_COMPARISON
                ? settings.seekampfEnabled
                : settings.nasaApodEnabled;
            trigger.hidden = !enabled;
            trigger.setAttribute("aria-pressed", String(activeView === view));
        });
        tools.hidden = triggers.every((trigger) => trigger.hidden);
    };

    const unsubscribe = subscribeKioskSelection(supabase, (selection) => {
        const wasActiveView = activeView;
        activeView = selection.kioskView;
        setButtons();
        if (wasActiveView !== activeView) {
            showSelectionStatus(activeView
                ? `${labelForView(activeView)} am Empfangsbildschirm geöffnet.`
                : "Zusatzansicht geschlossen.");
        }
    });
    const unsubscribeSettings = subscribeKioskSettings(supabase, (nextSettings) => {
        settings = nextSettings;
        setButtons();
    });

    triggers.forEach((trigger) => trigger.addEventListener("click", async () => {
        if (isPending) return;
        isPending = true;
        triggers.forEach((button) => { button.disabled = true; });

        const selectedView = trigger.dataset.kioskView;
        const nextView = activeView === selectedView ? null : selectedView;
        showSelectionStatus(
            nextView ? `${labelForView(nextView)} wird am Empfangsbildschirm geöffnet ...` : "Zusatzansicht wird geschlossen ..."
        );

        const saved = await setKioskViewSelection(supabase, nextView);
        isPending = false;
        triggers.forEach((button) => { button.disabled = false; });

        if (saved) {
            showSelectionStatus(nextView
                ? `${labelForView(nextView)} wird am Empfangsbildschirm angezeigt.`
                : "Zusatzansicht geschlossen.");
        } else {
            showSelectionStatus("Übertragung fehlgeschlagen. Supabase-Migration und Verbindung prüfen.", true);
        }
    }));

    return () => {
        unsubscribe();
        unsubscribeSettings();
    };
}

export const initSeekampfTabletButton = initWidgetTabletButtons;
