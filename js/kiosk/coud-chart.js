// Der offizielle Symbol-Overview-Embed ist selbst ein iframe. Wir erzeugen ihn
// direkt statt über TradingViews Loader-Skript: So bleibt seine Größe vollständig
// an den sichtbaren Kiosk-Rahmen gebunden und ein fehlgeschlagener Script-Load
// kann nicht mehr die gesamte Chartfläche leeren.
const COUD_TRADINGVIEW_EMBED = "https://www.tradingview-widget.com/embed-widget/symbol-overview/?locale=en#";
const MINIMUM_CHART_WIDTH = 280;
const MINIMUM_CHART_HEIGHT = 180;

function buildConfig(range) {
    return {
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
        autosize: true,
        width: "100%",
        height: "100%",
        noTimeScale: false,
        hideDateRanges: true,
        hideMarketStatus: false,
        hideSymbolLogo: false
    };
}

export function renderCoudChart(target, range = "1D", { onError } = {}) {
    if (!target) return;
    const request = Number(target.dataset.coudRenderRequest || "0") + 1;
    target.dataset.coudRenderRequest = String(request);
    let attempts = 0;

    const mountWhenVisible = () => {
        if (String(request) !== target.dataset.coudRenderRequest || !target.isConnected) return;
        const { width, height } = target.getBoundingClientRect();
        if (width < MINIMUM_CHART_WIDTH || height < MINIMUM_CHART_HEIGHT) {
            if (++attempts < 120) window.requestAnimationFrame(mountWhenVisible);
            else onError?.();
            return;
        }

        const frame = document.createElement("iframe");
        frame.className = "coud-tradingview-embed";
        frame.title = "COUD Aktienchart von TradingView";
        frame.src = `${COUD_TRADINGVIEW_EMBED}${encodeURIComponent(JSON.stringify(buildConfig(range)))}`;
        frame.loading = "eager";
        frame.referrerPolicy = "strict-origin-when-cross-origin";
        frame.setAttribute("allowtransparency", "true");
        const container = document.createElement("div");
        container.className = "coud-direct-embed-container";
        const copyright = document.createElement("div");
        copyright.className = "coud-chart-copyright";
        const link = document.createElement("a");
        link.href = "https://www.tradingview.com/symbols/GETTEX-COUD/";
        link.target = "_blank";
        link.rel = "noopener nofollow";
        link.textContent = "COUD stock price";
        copyright.append(link, document.createTextNode(" by TradingView"));
        container.append(frame, copyright);
        // Ein iframe-Load bestätigt nur das äußere Widget-Dokument; ein Fehler
        // im fremden Börseninhalt soll die Kioskfläche daher nicht ausblenden.
        target.replaceChildren(container);
    };

    // Das Ziel kann unmittelbar nach dialog.showModal() noch die Größe 0 haben.
    window.requestAnimationFrame(() => window.requestAnimationFrame(mountWhenVisible));
}
