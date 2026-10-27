import { supabase } from "../shared/supabase.js";
import { subscribeKioskSettings } from "../shared/kiosk-settings.js";
import {
    KIOSK_VIEW_NASA_APOD,
    getKioskViewAutoCloseDelay,
    setKioskViewSelection,
    subscribeKioskSelection
} from "../shared/tablet-settings.js";
import { loadApod, renderApod, renderApodError } from "./apod.js";

export function initNasaApodOverlay() {
    const dialog = document.getElementById("nasa-apod-dialog");
    const panel = dialog?.querySelector(".nasa-apod-dialog-panel");
    if (!dialog || !panel) return () => {};

    let enabled = false;
    let active = false;
    let latestSelection = { kioskView: null };
    let autoCloseTimer = null;

    const clearAutoCloseTimer = () => {
        if (autoCloseTimer !== null) window.clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
    };

    const scheduleAutoClose = () => {
        clearAutoCloseTimer();
        if (!active) return;
        autoCloseTimer = window.setTimeout(() => {
            autoCloseTimer = null;
            if (latestSelection.kioskView === KIOSK_VIEW_NASA_APOD) {
                void setKioskViewSelection(supabase, null);
            }
        }, getKioskViewAutoCloseDelay(latestSelection.kioskViewAt));
    };

    const load = async () => {
        const status = panel.querySelector("[data-apod-status]");
        if (status) {
            status.hidden = false;
            status.classList.remove("error");
            status.textContent = "NASA Picture of the Day wird geladen ...";
        }
        try {
            renderApod(panel, await loadApod(), { full: true });
        } catch (error) {
            renderApodError(panel, error);
        }
    };

    const applySelection = () => {
        const shouldShow = enabled && latestSelection.kioskView === KIOSK_VIEW_NASA_APOD;
        const wasActive = active;
        active = shouldShow;
        if (active) {
            if (!dialog.open) dialog.showModal();
            if (!wasActive) void load();
            scheduleAutoClose();
        } else if (dialog.open) {
            clearAutoCloseTimer();
            dialog.close();
        } else {
            clearAutoCloseTimer();
        }
    };

    const unsubscribeSelection = subscribeKioskSelection(supabase, (selection) => {
        latestSelection = selection;
        applySelection();
    });
    const unsubscribeSettings = subscribeKioskSettings(supabase, (settings) => {
        enabled = settings.nasaApodEnabled;
        if (!enabled && latestSelection.kioskView === KIOSK_VIEW_NASA_APOD) {
            void setKioskViewSelection(supabase, null);
        }
        applySelection();
    });

    dialog.addEventListener("cancel", (event) => event.preventDefault());
    dialog.addEventListener("close", () => {
        if (!active) return;
        active = false;
        clearAutoCloseTimer();
        void setKioskViewSelection(supabase, null);
    });

    return () => {
        unsubscribeSelection();
        unsubscribeSettings();
        clearAutoCloseTimer();
        if (dialog.open) dialog.close();
    };
}
