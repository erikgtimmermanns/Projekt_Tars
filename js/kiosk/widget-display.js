import { supabase } from "../shared/supabase.js";
import { subscribeKioskSettings } from "../shared/kiosk-settings.js";
import { subscribeKioskSelection } from "../shared/tablet-settings.js";
import { setWidgetLayoutState } from "./layout.js";
import { loadApod as fetchApod } from "./apod.js";
import { renderCoudChart } from "./coud-chart.js";

const WIDGET_SEEKAMPF = "seekampf";
const WIDGET_NASA_APOD = "nasa-apod";
const WIDGET_COUD_CHART = "coud-chart";
const APOD_EXCERPT_MAX_LENGTH = 280;

function excerpt(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= APOD_EXCERPT_MAX_LENGTH) return text;
    const boundary = text.lastIndexOf(" ", APOD_EXCERPT_MAX_LENGTH);
    return `${text.slice(0, boundary > 160 ? boundary : APOD_EXCERPT_MAX_LENGTH).trimEnd()} …`;
}

function formatApodDate(value) {
    const date = new Date(`${value}T12:00:00Z`);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(date);
}

function renderApod(panel, data) {
    const image = panel.querySelector("[data-apod-image]");
    const title = panel.querySelector("[data-apod-title]");
    const explanation = panel.querySelector("[data-apod-explanation]");
    const tabletHint = panel.querySelector("[data-apod-tablet-hint]");
    const meta = panel.querySelector("[data-apod-meta]");
    const status = panel.querySelector("[data-apod-status]");
    const content = panel.querySelector(".nasa-apod-content");
    if (!image || !title || !explanation || !meta || !status || !content) return;

    image.src = data.imageUrl;
    image.alt = data.alt || data.title || "NASA Astronomy Picture of the Day";
    title.textContent = data.title || "NASA Picture of the Day";
    const fullExplanation = String(data.explanation || "").replace(/\s+/g, " ").trim();
    explanation.textContent = excerpt(fullExplanation);
    if (tabletHint) tabletHint.hidden = !fullExplanation;
    const credit = data.copyright || data.credit;
    meta.textContent = [formatApodDate(data.date), credit ? `© ${credit}` : "NASA"].filter(Boolean).join(" · ");
    content.hidden = false;
    status.classList.remove("error");
    status.hidden = !data.stale;
    status.textContent = data.stale ? "NASA ist gerade nicht erreichbar; zuletzt geladenes Bild wird gezeigt." : "";
}

function renderApodError(panel, error) {
    const status = panel.querySelector("[data-apod-status]");
    const content = panel.querySelector(".nasa-apod-content");
    if (content) content.hidden = true;
    if (status) {
        status.hidden = false;
        status.classList.add("error");
        status.textContent = error?.message || "NASA Picture of the Day konnte nicht geladen werden.";
    }
}

export function initKioskWidgets() {
    const panel = document.getElementById("kiosk-widget-panel");
    const seekampfPanel = document.getElementById("seekampf-pinned-panel");
    const apodPanel = document.getElementById("nasa-apod-panel");
    const coudPanel = document.getElementById("coud-chart-panel");
    const coudFrame = coudPanel?.querySelector("[data-coud-chart-frame]");
    const coudStatus = coudPanel?.querySelector("[data-coud-chart-status]");
    if (!panel || !seekampfPanel || !apodPanel || !coudPanel || !coudFrame || !coudStatus) return () => {};

    let enabledWidgets = [];
    let activeIndex = 0;
    let intervalMs = 0;
    let timer = null;
    let apodPromise = null;
    let coudChartRange = "1D";
    let renderedCoudChartRange = null;

    const stopTimer = () => {
        if (timer) window.clearInterval(timer);
        timer = null;
    };

    const showActiveWidget = () => {
        const active = enabledWidgets[activeIndex];
        seekampfPanel.hidden = active !== WIDGET_SEEKAMPF;
        apodPanel.hidden = active !== WIDGET_NASA_APOD;
        coudPanel.hidden = active !== WIDGET_COUD_CHART;
        panel.hidden = !active;
        if (active === WIDGET_COUD_CHART) renderCoudWidget();
        setWidgetLayoutState(Boolean(active));
    };

    const renderCoudWidget = () => {
        if (renderedCoudChartRange === coudChartRange && coudFrame.childElementCount) return;
        coudStatus.hidden = false;
        coudStatus.classList.remove("error");
        coudStatus.textContent = "COUD Aktienchart wird geladen ...";
        renderCoudChart(coudFrame, coudChartRange, {
            onError: () => {
                coudStatus.hidden = false;
                coudStatus.classList.add("error");
                coudStatus.textContent = "TradingView-Chart konnte nicht geladen werden.";
            }
        });
        renderedCoudChartRange = coudChartRange;
        coudStatus.hidden = true;
    };

    const startTimer = () => {
        stopTimer();
        if (enabledWidgets.length < 2) return;
        timer = window.setInterval(() => {
            activeIndex = (activeIndex + 1) % enabledWidgets.length;
            showActiveWidget();
        }, intervalMs);
    };

    const loadApod = () => {
        if (apodPromise) return apodPromise;
        apodPromise = (async () => {
            const data = await fetchApod();
            renderApod(apodPanel, data);
            return data;
        })().catch((error) => {
            apodPromise = null;
            renderApodError(apodPanel, error);
            throw error;
        });
        return apodPromise;
    };

    const unsubscribe = subscribeKioskSettings(supabase, (settings) => {
        const nextWidgets = [];
        if (settings.seekampfEnabled) nextWidgets.push(WIDGET_SEEKAMPF);
        if (settings.nasaApodEnabled) nextWidgets.push(WIDGET_NASA_APOD);
        if (settings.coudChartEnabled) nextWidgets.push(WIDGET_COUD_CHART);
        const activeId = enabledWidgets[activeIndex];
        enabledWidgets = nextWidgets;
        activeIndex = Math.max(0, enabledWidgets.indexOf(activeId));
        intervalMs = settings.widgetRotateIntervalMs;
        if (settings.nasaApodEnabled) void loadApod().catch(() => {});
        showActiveWidget();
        startTimer();
    });
    const unsubscribeSelection = subscribeKioskSelection(supabase, (selection) => {
        coudChartRange = selection.chartRange || "1D";
        if (enabledWidgets[activeIndex] === WIDGET_COUD_CHART) renderCoudWidget();
    });

    return () => {
        stopTimer();
        unsubscribe();
        unsubscribeSelection();
        setWidgetLayoutState(false);
    };
}
