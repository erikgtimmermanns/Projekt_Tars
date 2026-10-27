import { supabase } from "../shared/supabase.js";
import { subscribeKioskSettings } from "../shared/kiosk-settings.js";
import {
    KIOSK_VIEW_ALLIANCE_COMPARISON,
    KIOSK_VIEW_NASA_APOD,
    KIOSK_VIEW_COUD_CHART,
    getKioskViewAutoCloseDelay,
    setKioskChartRange,
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
    if (view === KIOSK_VIEW_NASA_APOD) return "NASA Picture of the Day";
    if (view === KIOSK_VIEW_COUD_CHART) return "COUD Aktienchart";
    return "Allianzstatistik";
}

export function initWidgetTabletButtons() {
    const tools = document.querySelector(".tablet-tools");
    const triggers = [...document.querySelectorAll("[data-kiosk-view]")];
    const chartControls = document.getElementById("coud-chart-controls");
    const chartRangeTriggers = [...document.querySelectorAll("[data-coud-chart-range]")];
    if (!tools || !triggers.length) return () => {};

    let activeView = null;
    let activeChartRange = "1D";
    let latestSelection = { kioskView: null, chartRange: "1D", kioskViewAt: null };
    let isPending = false;
    let chartRangePending = false;
    let settings = { seekampfEnabled: false, nasaApodEnabled: false, coudChartEnabled: false };
    let autoCloseTimer = null;

    const clearAutoCloseTimer = () => {
        if (autoCloseTimer !== null) window.clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
    };

    const scheduleAutoClose = (selection) => {
        clearAutoCloseTimer();
        if (!activeView) return;
        autoCloseTimer = window.setTimeout(() => {
            autoCloseTimer = null;
            if (activeView) void setKioskViewSelection(supabase, null);
        }, getKioskViewAutoCloseDelay(selection.kioskViewAt));
    };

    const setButtons = () => {
        triggers.forEach((trigger) => {
            const view = trigger.dataset.kioskView;
            const enabled = view === KIOSK_VIEW_ALLIANCE_COMPARISON
                ? settings.seekampfEnabled
                : view === KIOSK_VIEW_NASA_APOD
                    ? settings.nasaApodEnabled
                    : settings.coudChartEnabled;
            trigger.hidden = !enabled;
            trigger.setAttribute("aria-pressed", String(activeView === view));
        });
        tools.hidden = triggers.every((trigger) => trigger.hidden);
        if (chartControls) {
            const coudIsOpen = activeView === KIOSK_VIEW_COUD_CHART && settings.coudChartEnabled;
            chartControls.hidden = !coudIsOpen;
            chartControls.classList.toggle("is-open", coudIsOpen);
        }
        chartRangeTriggers.forEach((trigger) => {
            trigger.setAttribute("aria-pressed", String(trigger.dataset.coudChartRange === activeChartRange));
            trigger.disabled = chartRangePending || activeView !== KIOSK_VIEW_COUD_CHART;
        });
    };

    const unsubscribe = subscribeKioskSelection(supabase, (selection) => {
        latestSelection = selection;
        const wasActiveView = activeView;
        activeView = selection.kioskView;
        activeChartRange = selection.chartRange;
        setButtons();
        scheduleAutoClose(selection);
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
        // Die Steuerung gehört nur zur geöffneten COUD-Ansicht. Sie verschwindet
        // beim Schließen oder Wechseln unverzüglich, nicht erst nach Realtime.
        if (activeView === KIOSK_VIEW_COUD_CHART && nextView !== KIOSK_VIEW_COUD_CHART) {
            activeView = nextView;
            clearAutoCloseTimer();
            setButtons();
        }
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
            activeView = latestSelection.kioskView;
            activeChartRange = latestSelection.chartRange;
            setButtons();
            scheduleAutoClose(latestSelection);
            showSelectionStatus("Übertragung fehlgeschlagen. Supabase-Migration und Verbindung prüfen.", true);
        }
    }));

    chartRangeTriggers.forEach((trigger) => trigger.addEventListener("click", async () => {
        const range = trigger.dataset.coudChartRange;
        if (chartRangePending || activeView !== KIOSK_VIEW_COUD_CHART || range === activeChartRange) return;
        chartRangePending = true;
        setButtons();
        showSelectionStatus(`Zeitraum ${trigger.textContent} wird am Empfangsbildschirm angezeigt ...`);
        const saved = await setKioskChartRange(supabase, range);
        chartRangePending = false;
        setButtons();
        if (!saved) {
            showSelectionStatus("Zeitraum konnte nicht übertragen werden.", true);
        }
    }));

    return () => {
        unsubscribe();
        unsubscribeSettings();
        clearAutoCloseTimer();
    };
}

export const initSeekampfTabletButton = initWidgetTabletButtons;
