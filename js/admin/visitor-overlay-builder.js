import { bucketName, configIsReady, supabase } from "../shared/supabase.js";
import { DEFAULT_VISITOR_OVERLAY_LAYOUT, fetchVisitorOverlayConfiguration, normalizeVisitorOverlayLayout, renderVisitorOverlay, VISITOR_OVERLAY_CONFIG_ID, VISITOR_OVERLAY_TABLE } from "../shared/visitor-overlay.js";

const REVISION_TABLE = "visitor_overlay_revisions";
const sampleVisitor = { name: "Musterfirma GmbH", imageUrl: "" };
const BLOCK_LABELS = { text: "Text", "visitor-name": "Besuchername", "visitor-logo": "Besucherlogo", image: "Bild", video: "Video" };
const clone = (value) => JSON.parse(JSON.stringify(value));
const uniqueId = (type) => `${type}-${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

function newBlock(type, x = 1, y = 1) {
    const base = { id: uniqueId(type), type, x, y, width: 4, height: 2, text: "", src: "", fontSize: "normal" };
    if (type === "text") return { ...base, text: "Neuer Text", width: 5, height: 1, fontSize: "large" };
    if (type === "visitor-name") return { ...base, width: 6, height: 2, fontSize: "hero" };
    if (type === "visitor-logo") return { ...base, width: 4, height: 3 };
    if (type === "image") return { ...base, text: "Bildbeschreibung", width: 5, height: 4 };
    return { ...base, text: "Besucher-Video", width: 7, height: 5 };
}

function gridPosition(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: Math.min(12, Math.max(1, Math.floor((event.clientX - rect.left) / rect.width * 12) + 1)),
        y: Math.min(12, Math.max(1, Math.floor((event.clientY - rect.top) / rect.height * 12) + 1))
    };
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));
}

function formatRevisionDate(value) {
    try { return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
    catch { return "Unbekannter Zeitpunkt"; }
}

export function initVisitorOverlayBuilder() {
    const canvas = document.getElementById("overlayCanvas");
    const preview = document.getElementById("overlayDevicePreview");
    const palette = document.getElementById("overlayPalette");
    const properties = document.getElementById("overlayProperties");
    const message = document.getElementById("overlayConfigMessage");
    const saveButton = document.getElementById("saveOverlayBtn");
    const publishButton = document.getElementById("publishOverlayBtn");
    const resetButton = document.getElementById("resetOverlayBtn");
    const undoButton = document.getElementById("undoOverlayBtn");
    const redoButton = document.getElementById("redoOverlayBtn");
    const revisionList = document.getElementById("overlayRevisionList");
    if (!canvas || !preview || !palette || !properties || !message || !saveButton || !publishButton || !resetButton || !undoButton || !redoButton || !revisionList) return { load: async () => {} };

    let layout = normalizeVisitorOverlayLayout(DEFAULT_VISITOR_OVERLAY_LAYOUT);
    let publishedLayout = layout;
    let selectedId = null;
    let dragId = null;
    let undoStack = [];
    let redoStack = [];
    let revisions = [];
    let loaded = false;

    const showMessage = (type, text) => { message.className = `notice-box ${type}`; message.textContent = text; };
    const currentBlock = () => layout.blocks.find((block) => block.id === selectedId) || null;
    const hasDraftChanges = () => JSON.stringify(layout) !== JSON.stringify(publishedLayout);
    const updateHistoryButtons = () => { undoButton.disabled = undoStack.length === 0; redoButton.disabled = redoStack.length === 0; };
    const snapshot = () => { undoStack.push(clone(layout)); if (undoStack.length > 60) undoStack.shift(); redoStack = []; updateHistoryButtons(); };
    const commit = (nextLayout, { history = true } = {}) => { if (history) snapshot(); layout = normalizeVisitorOverlayLayout(nextLayout); render(); };
    const patchSelected = (patch, options) => commit({ ...layout, blocks: layout.blocks.map((block) => block.id === selectedId ? { ...block, ...patch } : block) }, options);

    function renderProperties() {
        const block = currentBlock();
        if (!block) {
            properties.innerHTML = `<div class="overlay-inspector-empty"><strong>Eigenschaften</strong><p>Wähle einen Baustein aus, um Inhalt, Position oder Größe zu ändern.</p></div>`;
            return;
        }
        const contentControl = block.type === "text"
            ? `<label>Text<textarea data-overlay-property="text" rows="4">${escapeHtml(block.text)}</textarea></label>`
            : (block.type === "image" || block.type === "video")
                ? `<label>${block.type === "image" ? "Bild" : "Einbettungs"}-URL<input data-overlay-property="src" type="url" value="${escapeHtml(block.src)}" placeholder="https://…"></label>${block.type === "video" ? '<p class="field-hint">YouTube- und Vimeo-Seitenlinks werden automatisch in Embed-URLs umgewandelt. Andere Anbieter müssen Einbettung erlauben.</p>' : ""}<label>Beschreibung / Titel<input data-overlay-property="text" value="${escapeHtml(block.text)}"></label>`
                : `<p class="field-hint">Der Inhalt wird beim Tablet-Aufruf automatisch aus dem gewählten Besucherprofil befüllt.</p>`;
        properties.innerHTML = `
          <div class="overlay-property-title"><div><span>Ausgewählter Baustein</span><strong>${BLOCK_LABELS[block.type]}</strong></div><div><button type="button" class="icon-btn" data-overlay-action="duplicate" title="Duplizieren" aria-label="Duplizieren">⧉</button><button type="button" class="icon-btn is-danger" data-overlay-action="delete" title="Entfernen" aria-label="Entfernen">×</button></div></div>
          ${contentControl}
          ${block.type === "image" ? '<label class="overlay-upload-label">Bild hochladen<input id="overlayImageFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label><div id="overlayMediaLibrary" class="overlay-media-library"><span>Medien werden geladen …</span></div>' : ""}
          ${(block.type === "text" || block.type === "visitor-name") ? `<label>Textgröße<select data-overlay-property="fontSize"><option value="normal" ${block.fontSize === "normal" ? "selected" : ""}>Normal</option><option value="large" ${block.fontSize === "large" ? "selected" : ""}>Groß</option><option value="hero" ${block.fontSize === "hero" ? "selected" : ""}>Hero</option></select></label>` : ""}
          <fieldset class="overlay-position-fields"><legend>Raster</legend><label>Spalte<input data-overlay-property="x" type="number" min="1" max="12" value="${block.x}"></label><label>Zeile<input data-overlay-property="y" type="number" min="1" max="12" value="${block.y}"></label><label>Breite<input data-overlay-property="width" type="number" min="1" max="12" value="${block.width}"></label><label>Höhe<input data-overlay-property="height" type="number" min="1" max="12" value="${block.height}"></label></fieldset>`;
        properties.querySelectorAll("[data-overlay-property]").forEach((input) => input.addEventListener("change", () => patchSelected({ [input.dataset.overlayProperty]: input.value })));
        properties.querySelector("[data-overlay-action=delete]")?.addEventListener("click", () => { commit({ ...layout, blocks: layout.blocks.filter((item) => item.id !== selectedId) }); selectedId = null; render(); });
        properties.querySelector("[data-overlay-action=duplicate]")?.addEventListener("click", () => {
            const duplicate = { ...block, id: uniqueId(block.type), x: Math.min(12, block.x + 1), y: Math.min(12, block.y + 1) };
            selectedId = duplicate.id;
            commit({ ...layout, blocks: [...layout.blocks, duplicate] });
        });
        properties.querySelector("#overlayImageFile")?.addEventListener("change", uploadImage);
        if (block.type === "image") void loadMediaLibrary();
    }

    function makeResizable(element, block) {
        const handle = document.createElement("button");
        handle.type = "button";
        handle.className = "overlay-resize-handle";
        handle.setAttribute("aria-label", "Größe ändern");
        element.append(handle);
        handle.addEventListener("pointerdown", (event) => {
            event.preventDefault(); event.stopPropagation(); snapshot();
            const start = { x: event.clientX, y: event.clientY, width: block.width, height: block.height };
            const onMove = (moveEvent) => {
                const rect = canvas.getBoundingClientRect();
                patchSelected({ width: start.width + Math.round((moveEvent.clientX - start.x) / (rect.width / 12)), height: start.height + Math.round((moveEvent.clientY - start.y) / (rect.height / 12)) }, { history: false });
            };
            const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp, { once: true });
        });
    }

    function render() {
        renderVisitorOverlay(canvas, layout, sampleVisitor);
        renderVisitorOverlay(preview, layout, sampleVisitor);
        preview.classList.toggle("has-draft", hasDraftChanges());
        canvas.querySelectorAll("[data-overlay-block-id]").forEach((element) => {
            const block = layout.blocks.find((item) => item.id === element.dataset.overlayBlockId);
            element.classList.toggle("is-selected", element.dataset.overlayBlockId === selectedId);
            element.draggable = true;
            element.title = "Zum Verschieben ziehen – zum Bearbeiten anklicken";
            element.addEventListener("click", () => { selectedId = element.dataset.overlayBlockId; render(); });
            element.addEventListener("dragstart", (event) => { dragId = element.dataset.overlayBlockId; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/overlay-block-id", dragId); });
            if (block) makeResizable(element, block);
        });
        renderProperties();
        updateHistoryButtons();
    }

    async function uploadImage(event) {
        const file = event.target.files?.[0];
        if (!file || !selectedId) return;
        if (!configIsReady || !supabase) return showMessage("error", "Supabase ist noch nicht konfiguriert.");
        if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type) || file.size > 5 * 1024 * 1024) return showMessage("error", "Erlaubt sind PNG, JPG, WEBP oder SVG bis 5 MB.");
        const extension = file.name.split(".").pop()?.toLowerCase() || "png";
        const path = `overlay/${Date.now()}-${uniqueId("asset")}.${extension}`;
        const { data, error } = await supabase.storage.from(bucketName).upload(path, file, { contentType: file.type, upsert: false });
        if (error) return showMessage("error", error.message || "Bild konnte nicht hochgeladen werden.");
        const { data: publicUrl } = supabase.storage.from(bucketName).getPublicUrl(data.path);
        patchSelected({ src: publicUrl.publicUrl });
        showMessage("success", "Bild hochgeladen. Entwurf speichern oder veröffentlichen, um fortzufahren.");
    }

    async function loadMediaLibrary() {
        const target = properties.querySelector("#overlayMediaLibrary");
        if (!target || !configIsReady || !supabase) return;
        const { data, error } = await supabase.storage.from(bucketName).list("overlay", { limit: 30, sortBy: { column: "created_at", order: "desc" } });
        if (error) {
            target.innerHTML = "<span>Medienbibliothek ist nicht verfügbar.</span>";
            return;
        }
        const files = (data || []).filter((item) => item.name && item.name !== ".emptyFolderPlaceholder");
        if (!files.length) {
            target.innerHTML = "<span>Noch keine hochgeladenen Medien.</span>";
            return;
        }
        target.innerHTML = `<strong>Medienbibliothek</strong><div>${files.map((file) => {
            const { data: url } = supabase.storage.from(bucketName).getPublicUrl(`overlay/${file.name}`);
            return `<button type="button" data-overlay-media-url="${escapeHtml(url.publicUrl)}" title="${escapeHtml(file.name)}"><img src="${escapeHtml(url.publicUrl)}" alt="${escapeHtml(file.name)}"></button>`;
        }).join("")}</div>`;
        target.querySelectorAll("[data-overlay-media-url]").forEach((button) => button.addEventListener("click", () => patchSelected({ src: button.dataset.overlayMediaUrl })));
    }

    function renderRevisions() {
        if (!revisions.length) { revisionList.innerHTML = "<p class=\"field-hint\">Noch keine veröffentlichte Version.</p>"; return; }
        revisionList.innerHTML = revisions.map((revision) => `<article class="overlay-revision"><div><strong>${escapeHtml(revision.label)}</strong><span>${formatRevisionDate(revision.created_at)}</span></div><button type="button" class="secondary-btn" data-revision-id="${revision.id}">Als Entwurf laden</button></article>`).join("");
        revisionList.querySelectorAll("[data-revision-id]").forEach((button) => button.addEventListener("click", () => {
            const revision = revisions.find((item) => String(item.id) === button.dataset.revisionId);
            if (!revision) return;
            snapshot(); layout = normalizeVisitorOverlayLayout(revision.layout); selectedId = null; render();
            showMessage("success", "Version als Entwurf geladen. Sie wird erst nach dem Veröffentlichen aktiv.");
        }));
    }

    async function loadRevisions() {
        const { data, error } = await supabase.from(REVISION_TABLE).select("id, layout, label, created_at").eq("kiosk_settings_id", VISITOR_OVERLAY_CONFIG_ID).order("created_at", { ascending: false }).limit(12);
        if (error) throw error;
        revisions = data || [];
        renderRevisions();
    }

    palette.addEventListener("dragstart", (event) => {
        const type = event.target.closest("[data-overlay-type]")?.dataset.overlayType;
        if (!type) return;
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("text/overlay-type", type);
    });
    palette.addEventListener("click", (event) => {
        const type = event.target.closest("[data-overlay-type]")?.dataset.overlayType;
        if (!type) return;
        const block = newBlock(type);
        selectedId = block.id;
        commit({ ...layout, blocks: [...layout.blocks, block] });
    });
    canvas.addEventListener("dragover", (event) => event.preventDefault());
    canvas.addEventListener("drop", (event) => {
        event.preventDefault();
        const position = gridPosition(event, canvas);
        const type = event.dataTransfer.getData("text/overlay-type");
        const id = event.dataTransfer.getData("text/overlay-block-id") || dragId;
        if (type) {
            const block = newBlock(type, position.x, position.y);
            selectedId = block.id;
            commit({ ...layout, blocks: [...layout.blocks, block] });
        } else if (id) {
            selectedId = id;
            patchSelected(position);
            dragId = null;
        }
    });
    document.addEventListener("keydown", (event) => {
        if (!loaded || document.getElementById("overlayConfigView")?.hidden) return;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); undoButton.click(); }
        else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redoButton.click(); }
        else if (event.key === "Delete" && selectedId && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) properties.querySelector("[data-overlay-action=delete]")?.click();
    });
    undoButton.addEventListener("click", () => { if (!undoStack.length) return; redoStack.push(clone(layout)); layout = undoStack.pop(); selectedId = null; render(); });
    redoButton.addEventListener("click", () => { if (!redoStack.length) return; undoStack.push(clone(layout)); layout = redoStack.pop(); selectedId = null; render(); });
    document.querySelectorAll("[data-preview-scale]").forEach((button) => button.addEventListener("click", () => {
        preview.dataset.previewScale = button.dataset.previewScale;
        document.querySelectorAll("[data-preview-scale]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    }));
    saveButton.addEventListener("click", async () => {
        if (!configIsReady || !supabase) return showMessage("error", "Supabase ist noch nicht konfiguriert.");
        saveButton.disabled = true;
        try {
            const { error } = await supabase.from(VISITOR_OVERLAY_TABLE).update({ draft_layout: normalizeVisitorOverlayLayout(layout) }).eq("kiosk_settings_id", VISITOR_OVERLAY_CONFIG_ID);
            if (error) throw error;
            showMessage("success", "Entwurf gespeichert. Der Kiosk zeigt weiterhin die veröffentlichte Version.");
        } catch (error) { showMessage("error", error.message || "Entwurf konnte nicht gespeichert werden."); }
        finally { saveButton.disabled = false; }
    });
    publishButton.addEventListener("click", async () => {
        if (!configIsReady || !supabase) return showMessage("error", "Supabase ist noch nicht konfiguriert.");
        publishButton.disabled = true;
        try {
            const label = `Veröffentlicht am ${new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date())}`;
            const { error } = await supabase.rpc("publish_visitor_overlay", { p_layout: normalizeVisitorOverlayLayout(layout), p_label: label });
            if (error) throw error;
            publishedLayout = clone(layout);
            await loadRevisions();
            render();
            showMessage("success", "Overlay veröffentlicht – die Änderung ist jetzt live auf dem Kiosk.");
        } catch (error) { showMessage("error", error.message || "Overlay konnte nicht veröffentlicht werden."); }
        finally { publishButton.disabled = false; }
    });
    resetButton.addEventListener("click", () => { selectedId = null; commit(DEFAULT_VISITOR_OVERLAY_LAYOUT); showMessage("success", "Standardlayout als Entwurf geladen. Zum Aktivieren veröffentlichen."); });

    async function load() {
        if (!configIsReady || !supabase) return;
        try {
            const config = await fetchVisitorOverlayConfiguration(supabase);
            layout = config.draftLayout;
            publishedLayout = config.publishedLayout;
            selectedId = null;
            undoStack = [];
            redoStack = [];
            loaded = true;
            render();
            await loadRevisions();
        } catch (error) {
            showMessage("error", `${error.message || "Overlay-Konfiguration konnte nicht geladen werden."} Bitte die aktuelle Overlay-Migration in Supabase ausführen.`);
        }
    }

    render();
    return { load };
}
