const PDF_URL = "./assets/Fake_News_Präsi_Style.pdf";
const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
const PDFJS_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
const SLIDE_INTERVAL_MS = 10000;

export async function initPresentation() {
    const panel = document.getElementById("presentation-panel");
    const canvas = document.getElementById("presentation-canvas");
    const status = document.getElementById("presentation-status");
    const context = canvas?.getContext("2d");
    if (!panel || !canvas || !status || !context) return;

    let documentHandle;
    let pageNumber = 1;
    let renderTask = null;
    let renderVersion = 0;
    let slideTimer = null;

    async function renderPage() {
        if (!documentHandle) return;
        const version = ++renderVersion;
        if (renderTask) renderTask.cancel();

        try {
            const page = await documentHandle.getPage(pageNumber);
            const baseViewport = page.getViewport({ scale: 1 });
            panel.style.setProperty(
                "--presentation-aspect-ratio",
                `${baseViewport.width} / ${baseViewport.height}`
            );
            const bounds = panel.getBoundingClientRect();
            if (bounds.width <= 0 || bounds.height <= 0) return;

            const scale = Math.min(bounds.width / baseViewport.width, bounds.height / baseViewport.height);
            const viewport = page.getViewport({ scale });
            const pixelRatio = window.devicePixelRatio || 1;

            canvas.width = Math.ceil(viewport.width * pixelRatio);
            canvas.height = Math.ceil(viewport.height * pixelRatio);
            canvas.style.width = `${viewport.width}px`;
            canvas.style.height = `${viewport.height}px`;
            renderTask = page.render({
                canvasContext: context,
                viewport,
                transform: pixelRatio === 1 ? null : [pixelRatio, 0, 0, pixelRatio, 0, 0]
            });
            await renderTask.promise;
            if (version === renderVersion) {
                status.hidden = true;
            }
        } catch (error) {
            if (error?.name !== "RenderingCancelledException") {
                console.warn("Presentation page could not be rendered:", error);
            }
        }
    }

    try {
        const pdfjs = await import(PDFJS_URL);
        pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        documentHandle = await pdfjs.getDocument(PDF_URL).promise;
        if (documentHandle.numPages < 1) throw new Error("Die PDF enthält keine Seiten.");

        await renderPage();
        slideTimer = window.setInterval(() => {
            pageNumber = pageNumber % documentHandle.numPages + 1;
            void renderPage();
        }, SLIDE_INTERVAL_MS);

        if (typeof ResizeObserver === "function") {
            new ResizeObserver(() => void renderPage()).observe(panel);
        } else {
            window.addEventListener("resize", () => void renderPage());
        }
    } catch (error) {
        console.warn("Presentation could not be loaded:", error);
        status.textContent = "Präsentations-PDF fehlt. Bitte die PowerPoint als PDF exportieren.";
    }

    return () => {
        window.clearInterval(slideTimer);
        if (renderTask) renderTask.cancel();
        documentHandle?.destroy();
    };
}
