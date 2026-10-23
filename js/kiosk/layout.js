const layoutState = {
    visitorCount: 0,
    visitorMode: "rotate",
    visitorStateReady: false,
    seekampfEnabled: false,
    seekampfReady: false
};

let screen;
let pinnedPanel;
let resizeObserver;
let scheduledFrame = 0;

function scheduleLayout() {
    if (scheduledFrame) return;
    scheduledFrame = window.requestAnimationFrame(() => {
        scheduledFrame = 0;
        updateLayout();
    });
}

function measurePinnedPanel(panel, width) {
    panel.style.setProperty("--seekampf-measure-width", `${width}px`);
    panel.classList.add("is-measuring");
    const height = panel.getBoundingClientRect().height;
    panel.classList.remove("is-measuring");
    panel.style.removeProperty("--seekampf-measure-width");
    return height;
}

function getBoxHeight(element) {
    return element?.hidden ? 0 : element?.getBoundingClientRect().height || 0;
}

function updateLayout() {
    if (!screen || !pinnedPanel) return;

    const shouldBeEligible = layoutState.seekampfEnabled
        && layoutState.seekampfReady
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
    const statHeight = measurePinnedPanel(pinnedPanel, contentWidth);

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

export function setSeekampfLayoutState(enabled, ready) {
    layoutState.seekampfEnabled = Boolean(enabled);
    layoutState.seekampfReady = Boolean(ready);
    scheduleLayout();
}

export function initKioskLayout() {
    screen = document.querySelector(".screen");
    pinnedPanel = document.getElementById("seekampf-pinned-panel");
    if (!screen || !pinnedPanel) return;

    if (typeof ResizeObserver === "function") {
        resizeObserver = new ResizeObserver(scheduleLayout);
        [screen, ...screen.querySelectorAll(".topbar, #visitor-panel, #presentation-panel, .market-ticker, .footer")]
            .forEach((element) => resizeObserver.observe(element));
    }
    window.addEventListener("resize", scheduleLayout);
    scheduleLayout();
}
