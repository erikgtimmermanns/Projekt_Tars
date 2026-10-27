import { supabase } from "../shared/supabase.js";
import { subscribeKioskSettings } from "../shared/kiosk-settings.js";
import {
    KIOSK_VIEW_COUD_CHART,
    getKioskViewAutoCloseDelay,
    setKioskViewSelection,
    subscribeKioskSelection
} from "../shared/tablet-settings.js";
import { renderCoudChart } from "./coud-chart.js";

export function initCoudChartOverlay() {
    const dialog = document.getElementById("coud-chart-dialog");
    const frame = dialog?.querySelector("[data-coud-chart-frame]");
    const status = dialog?.querySelector("[data-coud-chart-status]");
    if (!dialog || !frame || !status) return () => {};

    let enabled = false;
    let active = false;
    let renderedRange = null;
    let latestSelection = { kioskView: null, chartRange: "1D" };
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
            if (latestSelection.kioskView === KIOSK_VIEW_COUD_CHART) {
                void setKioskViewSelection(supabase, null);
            }
        }, getKioskViewAutoCloseDelay(latestSelection.kioskViewAt));
    };

    const render = () => {
        const range = latestSelection.chartRange || "1D";
        if (renderedRange === range && frame.childElementCount) return;
        status.hidden = false;
        status.classList.remove("error");
        status.textContent = "COUD Aktienchart wird geladen ...";
        renderCoudChart(frame, range, {
            onError: () => {
                status.hidden = false;
                status.classList.add("error");
                status.textContent = "TradingView-Chart konnte nicht geladen werden.";
            }
        });
        renderedRange = range;
        status.hidden = true;
    };

    const applySelection = () => {
        const shouldShow = enabled && latestSelection.kioskView === KIOSK_VIEW_COUD_CHART;
        const wasActive = active;
        active = shouldShow;
        if (active) {
            if (!dialog.open) dialog.showModal();
            if (!wasActive || renderedRange !== latestSelection.chartRange) render();
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
        enabled = settings.coudChartEnabled;
        if (!enabled && latestSelection.kioskView === KIOSK_VIEW_COUD_CHART) {
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
