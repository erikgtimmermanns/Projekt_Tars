const layoutState = {
    visitorCount: 0,
    visitorMode: "rotate",
    visitorStateReady: false,
    widgetEnabled: false
};

let screen;
let pinnedPanel;
let resizeObserver;
let scheduledFrame = 0;
let sharedWidgetHeight = 0;

function scheduleLayout() {
    if (scheduledFrame) return;
    scheduledFrame = window.requestAnimationFrame(() => {
        scheduledFrame = 0;
        updateLayout();
    });
}

function measureWidgetPanel(panel, width) {
    const activeWidget = panel.querySelector(".kiosk-widget-card:not([hidden])");
    if (!activeWidget) return 0;
    activeWidget.style.setProperty("--widget-measure-width", `${width}px`);
    if (activeWidget.id === "nasa-apod-panel" && sharedWidgetHeight > 0) {
        activeWidget.style.setProperty("--widget-measure-height", `${sharedWidgetHeight}px`);
    }
    activeWidget.classList.add("is-measuring");
    const height = activeWidget.getBoundingClientRect().height;
    activeWidget.classList.remove("is-measuring");
    activeWidget.style.removeProperty("--widget-measure-width");
    activeWidget.style.removeProperty("--widget-measure-height");
    if (activeWidget.id === "seekampf-pinned-panel" && height > 0) {
        sharedWidgetHeight = height;
        panel.style.setProperty("--kiosk-widget-height", `${height}px`);
    }
    return height;
}

function getBoxHeight(element) {
    return element?.hidden ? 0 : element?.getBoundingClientRect().height || 0;
}

function updateLayout() {
    if (!screen || !pinnedPanel) return;

    const shouldBeEligible = layoutState.widgetEnabled
        && layoutState.visitorStateReady
        && !(layoutState.visitorCount > 1 && layoutState.visitorMode === "stack");
    if (!shouldBeEligible) {
        if (!pinnedPanel.hidden) pinnedPanel.hidden = true;
        return;
    }

    const screenStyle = getComputedStyle(screen);
    const contentHeight = screen.clientHeight
        - (Number.parseFloat(screenStyle.paddingTop) || 0)
        - (Number.parseFloat(screenStyle.paddingBottom) || 0);
    const contentWidth = screen.clientWidth
        - (Number.parseFloat(screenStyle.paddingLeft) || 0)
        - (Number.parseFloat(screenStyle.paddingRight) || 0);
    const weatherMinHeight = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--kiosk-weather-min-height")
    ) || 110;

    const header = screen.querySelector(".topbar");
    const visitor = screen.querySelector("#visitor-panel");
    const presentation = screen.querySelector("#presentation-panel");
    const ticker = screen.querySelector(".market-ticker");
    const footer = screen.querySelector(".footer");
    const presentationMargin = Number.parseFloat(getComputedStyle(presentation).marginTop) || 0;
    const footerMargin = Number.parseFloat(getComputedStyle(footer).marginTop) || 0;
    const statHeight = measureWidgetPanel(pinnedPanel, contentWidth);

    const reservedHeight = getBoxHeight(header)
        + getBoxHeight(visitor)
        + getBoxHeight(presentation)
        + presentationMargin
        + getBoxHeight(ticker)
        + getBoxHeight(footer)
        + footerMargin
        + weatherMinHeight;
    const fits = Number.isFinite(statHeight)
        && contentWidth > 0
        && reservedHeight + statHeight <= contentHeight + 1;

    if (pinnedPanel.hidden === fits) pinnedPanel.hidden = !fits;
}

export function setVisitorLayoutState(count, mode) {
    layoutState.visitorCount = Math.max(0, Number(count) || 0);
    layoutState.visitorMode = mode === "stack" ? "stack" : "rotate";
    layoutState.visitorStateReady = true;
    scheduleLayout();
}

export function setWidgetLayoutState(enabled) {
    layoutState.widgetEnabled = Boolean(enabled);
    scheduleLayout();
}

// Kompatibilität für vorhandene Aufrufer während der Widget-Umstellung.
export function setSeekampfLayoutState(enabled) {
    setWidgetLayoutState(enabled);
}

export function initKioskLayout() {
    screen = document.querySelector(".screen");
    pinnedPanel = document.getElementById("kiosk-widget-panel");
    if (!screen || !pinnedPanel) return;

    if (typeof ResizeObserver === "function") {
        resizeObserver = new ResizeObserver(scheduleLayout);
        [screen, ...screen.querySelectorAll(".topbar, #visitor-panel, #presentation-panel, .market-ticker, .footer")]
        .concat([...screen.querySelectorAll(".kiosk-widget-card")])
            .forEach((element) => resizeObserver.observe(element));
    }
    window.addEventListener("resize", scheduleLayout);
    scheduleLayout();
}
