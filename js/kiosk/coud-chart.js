export const COUD_TRADINGVIEW_SCRIPT = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";

const MINIMUM_CHART_WIDTH = 280;
const MINIMUM_CHART_HEIGHT = 180;

export function renderCoudChart(target, range = "1D", { onError } = {}) {
    if (!target) return;
    const request = Number(target.dataset.coudRenderRequest || "0") + 1;
    target.dataset.coudRenderRequest = String(request);
    scheduleRender(target, { request, range, onError });
}

function scheduleRender(target, { request, range, onError }) {
    let attempts = 0;
    const waitForVisibleFrame = () => {
        if (String(request) !== target.dataset.coudRenderRequest || !target.isConnected) return;
        const { width, height } = target.getBoundingClientRect();
        if (width < MINIMUM_CHART_WIDTH || height < MINIMUM_CHART_HEIGHT) {
            if (++attempts < 120) window.requestAnimationFrame(waitForVisibleFrame);
            else onError?.();
            return;
        }
        // Der Dialog/Grid-Layout muss zwei Browserframes lang sichtbar sein,
        // bevor TradingViews autosize den iframe mit der finalen Höhe erzeugt.
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
            if (String(request) !== target.dataset.coudRenderRequest || !target.isConnected) return;
            mountChart(target, { range, onError }, width, height);
        }));
    };
    window.requestAnimationFrame(waitForVisibleFrame);
}

function mountChart(target, { range, onError }, width, height) {

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
    script.addEventListener("error", () => onError?.());
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
        symbols: [[`GETTEX:COUD|${range}`]],
        dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
        fontSize: "10",
        headerFontSize: "medium",
        // TradingViews Symbol-Overview-Widget reagiert in verschachtelten
        // Grid-/Dialog-Flächen nicht verlässlich auf 100%-Höhen. Die finale,
        // sichtbare Rahmengröße wird daher explizit übergeben.
        autosize: false,
        width: String(Math.floor(width)),
        height: String(Math.max(160, Math.floor(height - 24))),
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
}
