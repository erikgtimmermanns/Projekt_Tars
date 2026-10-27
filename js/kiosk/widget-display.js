import { supabase } from "../shared/supabase.js";
import { subscribeKioskSettings } from "../shared/kiosk-settings.js";
import { setWidgetLayoutState } from "./layout.js";

const WIDGET_SEEKAMPF = "seekampf";
const WIDGET_NASA_APOD = "nasa-apod";
const EXPLANATION_SCROLL_SPEED_PX_PER_SECOND = 14;
const EXPLANATION_SCROLL_PAUSE_MS = 2200;
const explanationScrollFrames = new WeakMap();

function stopExplanationScroll(element) {
    const frame = explanationScrollFrames.get(element);
    if (frame) window.cancelAnimationFrame(frame);
    explanationScrollFrames.delete(element);
}

function startExplanationScroll(element) {
    if (!element || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    stopExplanationScroll(element);
    element.scrollTop = 0;

    window.requestAnimationFrame(() => {
        const maxScrollTop = element.scrollHeight - element.clientHeight;
        if (maxScrollTop <= 1) return;

        const scrollingDurationMs = maxScrollTop / EXPLANATION_SCROLL_SPEED_PX_PER_SECOND * 1000;
        const cycleDurationMs = EXPLANATION_SCROLL_PAUSE_MS * 2 + scrollingDurationMs;
        const startedAt = performance.now();
        const tick = (now) => {
            const elapsed = (now - startedAt) % cycleDurationMs;
            if (elapsed <= EXPLANATION_SCROLL_PAUSE_MS) {
                element.scrollTop = 0;
            } else if (elapsed <= EXPLANATION_SCROLL_PAUSE_MS + scrollingDurationMs) {
                element.scrollTop = (elapsed - EXPLANATION_SCROLL_PAUSE_MS)
                    / scrollingDurationMs * maxScrollTop;
            } else {
                element.scrollTop = maxScrollTop;
            }
            explanationScrollFrames.set(element, window.requestAnimationFrame(tick));
        };
        explanationScrollFrames.set(element, window.requestAnimationFrame(tick));
    });
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
    const meta = panel.querySelector("[data-apod-meta]");
    const status = panel.querySelector("[data-apod-status]");
    if (!image || !title || !explanation || !meta || !status) return;

    image.src = data.imageUrl;
    image.alt = data.alt || data.title || "NASA Astronomy Picture of the Day";
    title.textContent = data.title || "NASA Picture of the Day";
    explanation.textContent = String(data.explanation || "").replace(/\s+/g, " ").trim();
    startExplanationScroll(explanation);
    const credit = data.copyright || data.credit;
    meta.textContent = [formatApodDate(data.date), credit ? `© ${credit}` : "NASA"].filter(Boolean).join(" · ");
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
    if (!panel || !seekampfPanel || !apodPanel) return () => {};

    let enabledWidgets = [];
    let activeIndex = 0;
    let intervalMs = 0;
    let timer = null;
    let apodPromise = null;

    const stopTimer = () => {
        if (timer) window.clearInterval(timer);
        timer = null;
    };

    const showActiveWidget = () => {
        const active = enabledWidgets[activeIndex];
        seekampfPanel.hidden = active !== WIDGET_SEEKAMPF;
        apodPanel.hidden = active !== WIDGET_NASA_APOD;
        panel.hidden = !active;
        if (active === WIDGET_NASA_APOD) {
            startExplanationScroll(apodPanel.querySelector("[data-apod-explanation]"));
        } else {
            stopExplanationScroll(apodPanel.querySelector("[data-apod-explanation]"));
        }
        setWidgetLayoutState(Boolean(active));
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
            const response = await fetch("/api/nasa/apod", { cache: "no-store" });
            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                throw new Error("API-Server fehlt. Bitte im Projektordner `npm start` ausführen und die Seite über Port 4173 öffnen.");
            }
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
            if (!data.imageUrl) throw new Error("NASA lieferte kein anzeigbares Bild.");
            renderApod(apodPanel, data);
            return data;
        })().catch((error) => {
            renderApodError(apodPanel, error);
            throw error;
        });
        return apodPromise;
    };

    const unsubscribe = subscribeKioskSettings(supabase, (settings) => {
        const nextWidgets = [];
        if (settings.seekampfEnabled) nextWidgets.push(WIDGET_SEEKAMPF);
        if (settings.nasaApodEnabled) nextWidgets.push(WIDGET_NASA_APOD);
        const activeId = enabledWidgets[activeIndex];
        enabledWidgets = nextWidgets;
        activeIndex = Math.max(0, enabledWidgets.indexOf(activeId));
        intervalMs = settings.widgetRotateIntervalMs;
        if (settings.nasaApodEnabled) void loadApod().catch(() => {});
        showActiveWidget();
        startTimer();
    });

    return () => {
        stopTimer();
        unsubscribe();
        setWidgetLayoutState(false);
    };
}
