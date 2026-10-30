export const COUD_TRADINGVIEW_SCRIPT = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";

const MINIMUM_CHART_WIDTH = 280;
const MINIMUM_CHART_HEIGHT = 220;
const resizeStates = new WeakMap();

export function renderCoudChart(target, range = "1D", { onError } = {}) {
    if (!target) return;

    let state = resizeStates.get(target);
    if (!state) {
        state = { request: 0, range, onError, observer: null, resizeTimer: null, lastWidth: 0, lastHeight: 0 };
        state.observer = new ResizeObserver(() => {
            if (!state.lastWidth || !state.lastHeight) return;
            const { width, height } = target.getBoundingClientRect();
            if (Math.abs(width - state.lastWidth) < 24 && Math.abs(height - state.lastHeight) < 24) return;
            window.clearTimeout(state.resizeTimer);
            state.resizeTimer = window.setTimeout(() => scheduleRender(target, state), 180);
        });
        state.observer.observe(target);
        resizeStates.set(target, state);
    }
    state.range = range;
    state.onError = onError;
    scheduleRender(target, state);
}

function scheduleRender(target, state) {
    const request = ++state.request;
    let attempts = 0;
    const waitForVisibleFrame = () => {
        if (request !== state.request || !target.isConnected) return;
        const { width, height } = target.getBoundingClientRect();
        if (width < MINIMUM_CHART_WIDTH || height < MINIMUM_CHART_HEIGHT) {
            if (++attempts < 120) window.requestAnimationFrame(waitForVisibleFrame);
            return;
        }
        // Der Dialog/Grid-Layout muss zwei Browserframes lang sichtbar sein,
        // bevor TradingViews autosize den iframe mit der finalen Höhe erzeugt.
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
            if (request !== state.request || !target.isConnected) return;
            mountChart(target, state, width, height);
        }));
    };
    window.requestAnimationFrame(waitForVisibleFrame);
}

function mountChart(target, state, width, height) {

    const container = document.createElement("div");
    container.className = "tradingview-widget-container coud-tradingview-container";

    const chart = document.createElement("div");
    chart.className = "tradingview-widget-container__widget";

    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright coud-chart-copyright";
    const link = document.createElement("a");
    link.href = "https://www.tradingview.com/symbols/GETTEX-COUD/";
    link.target = "_blank";
    link.rel = "noopener nofollow";
    link.textContent = "COUD stock price";
    copyright.append(link, document.createTextNode(" by TradingView"));

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = COUD_TRADINGVIEW_SCRIPT;
    script.async = true;
    script.addEventListener("error", () => state.onError?.());
    // Der iframe-Embed übernimmt diese Konfiguration beim Einfügen des Scripts.
    // Bei einem Zeitraumwechsel wird gezielt ein neuer Container erzeugt.
    script.textContent = JSON.stringify({
        lineWidth: 2,
        lineType: 0,
        chartType: "area",
        fontColor: "rgb(106, 109, 120)",
        gridLineColor: "rgba(242, 242, 242, 0.06)",
        volumeUpColor: "rgba(34, 171, 148, 0.5)",
        volumeDownColor: "rgba(247, 82, 95, 0.5)",
        backgroundColor: "#0F0F0F",
        widgetFontColor: "#DBDBDB",
        upColor: "#22ab94",
        downColor: "#f7525f",
        borderUpColor: "#22ab94",
        borderDownColor: "#f7525f",
        wickUpColor: "#22ab94",
        wickDownColor: "#f7525f",
        colorTheme: "dark",
        isTransparent: false,
        locale: "en",
        chartOnly: false,
        scalePosition: "right",
        scaleMode: "Normal",
        fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
        valuesTracking: "1",
        changeMode: "price-and-percent",
        symbols: [[`GETTEX:COUD|${state.range}`]],
        dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
        fontSize: "10",
        headerFontSize: "medium",
        autosize: true,
        width: "100%",
        height: "100%",
        noTimeScale: false,
        // Das Tablet ist die einzige Steuerung für den Zeitraum.
        hideDateRanges: true,
        hideMarketStatus: false,
        hideSymbolLogo: false
    });

    container.append(chart, copyright);
    target.replaceChildren(container);
    // Externe Scripts müssen erst nach dem Einfügen des Containers ins
    // Dokument angehängt werden. Andernfalls wird der iframe-Embed je nach
    // Browser nicht initialisiert.
    container.append(script);
    state.lastWidth = width;
    state.lastHeight = height;
}
