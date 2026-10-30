import { bucketName, configIsReady, supabase } from "../shared/supabase.js";
import { DEFAULT_VISITOR_OVERLAY_LAYOUT, fetchVisitorOverlayLayout, normalizeVisitorOverlayLayout, renderVisitorOverlay, VISITOR_OVERLAY_CONFIG_ID, VISITOR_OVERLAY_TABLE } from "../shared/visitor-overlay.js";

const sampleVisitor = {
    name: "Musterfirma GmbH",
    imageUrl: ""
};

const BLOCK_LABELS = {
    text: "Text",
    "visitor-name": "Besuchername",
    "visitor-logo": "Besucherlogo",
    image: "Bild",
    video: "Video"
};

function newBlock(type, x = 1, y = 1) {
    const id = `${type}-${crypto.randomUUID?.() || Date.now().toString(36)}`;
    const base = { id, type, x, y, width: 4, height: 2, text: "", src: "", fontSize: "normal" };
    if (type === "text") return { ...base, text: "Neuer Text", width: 5, height: 1, fontSize: "large" };
    if (type === "visitor-name") return { ...base, width: 5, height: 2, fontSize: "hero" };
    if (type === "visitor-logo") return { ...base, width: 4, height: 3 };
    if (type === "image") return { ...base, text: "Bildbeschreibung", width: 5, height: 4 };
    return { ...base, text: "Besucher-Video", width: 7, height: 5 };
}

function gridPosition(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(12, Math.max(1, Math.floor((event.clientX - rect.left) / rect.width * 12) + 1));
    const y = Math.min(12, Math.max(1, Math.floor((event.clientY - rect.top) / rect.height * 12) + 1));
    return { x, y };
}

export function initVisitorOverlayBuilder() {
    const canvas = document.getElementById("overlayCanvas");
    const palette = document.getElementById("overlayPalette");
    const properties = document.getElementById("overlayProperties");
    const saveButton = document.getElementById("saveOverlayBtn");
    const resetButton = document.getElementById("resetOverlayBtn");
    const message = document.getElementById("overlayConfigMessage");
    const imageFile = document.getElementById("overlayImageFile");
    if (!canvas || !palette || !properties || !saveButton || !resetButton || !message) return { load: async () => {} };

    let layout = normalizeVisitorOverlayLayout(DEFAULT_VISITOR_OVERLAY_LAYOUT);
    let selectedId = null;
    let dragId = null;

    const showMessage = (type, text) => {
        message.className = `notice-box ${type}`;
        message.textContent = text;
    };
    const selectedBlock = () => layout.blocks.find((block) => block.id === selectedId) || null;
    const patchSelected = (patch) => {
        layout = normalizeVisitorOverlayLayout({
            ...layout,
            blocks: layout.blocks.map((block) => block.id === selectedId ? { ...block, ...patch } : block)
        });
        render();
    };

    const renderProperties = () => {
        const block = selectedBlock();
        if (!block) {
            properties.innerHTML = "<p class=\"field-hint\">Ziehe einen Baustein auf die Fläche oder wähle einen vorhandenen Baustein aus.</p>";
            return;
        }
        const contentControl = block.type === "text"
            ? `<label>Text<textarea data-overlay-property="text" rows="4">${escapeHtml(block.text)}</textarea></label>`
            : (block.type === "image" || block.type === "video")
                ? `<label>${block.type === "image" ? "Bild" : "Einbettungs"}-URL<input data-overlay-property="src" type="url" value="${escapeHtml(block.src)}" placeholder="https://…"></label>
                   <label>Beschreibung / Titel<input data-overlay-property="text" value="${escapeHtml(block.text)}"></label>`
                : "<p class=\"field-hint\">Dieser Block erhält seinen Inhalt automatisch vom ausgewählten Besucher.</p>";
        properties.innerHTML = `
            <div class="overlay-property-title"><strong>${BLOCK_LABELS[block.type]}</strong><button type="button" class="danger-btn" data-overlay-action="delete">Entfernen</button></div>
            ${contentControl}
            ${block.type === "image" ? '<label class="overlay-upload-label">Oder Bild hochladen<input id="overlayImageFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label>' : ""}
            ${(block.type === "text" || block.type === "visitor-name") ? `<label>Textgröße<select data-overlay-property="fontSize"><option value="normal" ${block.fontSize === "normal" ? "selected" : ""}>Normal</option><option value="large" ${block.fontSize === "large" ? "selected" : ""}>Groß</option><option value="hero" ${block.fontSize === "hero" ? "selected" : ""}>Hero</option></select></label>` : ""}
            <div class="overlay-position-fields">
              <label>Spalte<input data-overlay-property="x" type="number" min="1" max="12" value="${block.x}"></label>
              <label>Zeile<input data-overlay-property="y" type="number" min="1" max="12" value="${block.y}"></label>
              <label>Breite<input data-overlay-property="width" type="number" min="1" max="12" value="${block.width}"></label>
              <label>Höhe<input data-overlay-property="height" type="number" min="1" max="12" value="${block.height}"></label>
            </div>`;
        properties.querySelectorAll("[data-overlay-property]").forEach((input) => {
            input.addEventListener("input", () => patchSelected({ [input.dataset.overlayProperty]: input.value }));
        });
        properties.querySelector("[data-overlay-action=delete]")?.addEventListener("click", () => {
            layout = { ...layout, blocks: layout.blocks.filter((item) => item.id !== selectedId) };
            selectedId = null;
            render();
        });
        properties.querySelector("#overlayImageFile")?.addEventListener("change", uploadImage);
    };

    const render = () => {
        renderVisitorOverlay(canvas, layout, sampleVisitor);
        canvas.querySelectorAll("[data-overlay-block-id]").forEach((element) => {
            const selected = element.dataset.overlayBlockId === selectedId;
            element.classList.toggle("is-selected", selected);
            element.draggable = true;
            element.title = "Zum Verschieben ziehen – zum Bearbeiten anklicken";
            element.addEventListener("click", () => { selectedId = element.dataset.overlayBlockId; render(); });
            element.addEventListener("dragstart", (event) => {
                dragId = element.dataset.overlayBlockId;
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/overlay-block-id", dragId);
            });
        });
        renderProperties();
    };

    async function uploadImage(event) {
        const file = event.target.files?.[0];
        if (!file || !selectedId) return;
        if (!configIsReady || !supabase) return showMessage("error", "Supabase ist noch nicht konfiguriert.");
        if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
            return showMessage("error", "Erlaubt sind PNG, JPG, WEBP oder SVG bis 5 MB.");
        }
        const extension = file.name.split(".").pop()?.toLowerCase() || "png";
        const path = `overlay/${Date.now()}-${crypto.randomUUID?.() || "image"}.${extension}`;
        const { data, error } = await supabase.storage.from(bucketName).upload(path, file, { contentType: file.type, upsert: false });
        if (error) return showMessage("error", error.message || "Bild konnte nicht hochgeladen werden.");
        const { data: publicUrl } = supabase.storage.from(bucketName).getPublicUrl(data.path);
        patchSelected({ src: publicUrl.publicUrl });
        showMessage("success", "Bild hochgeladen. Bitte das Overlay noch speichern.");
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
        const block = newBlock(type, 1, 1);
        layout = { ...layout, blocks: [...layout.blocks, block] };
        selectedId = block.id;
        render();
    });
    canvas.addEventListener("dragover", (event) => event.preventDefault());
    canvas.addEventListener("drop", (event) => {
        event.preventDefault();
        const position = gridPosition(event, canvas);
        const type = event.dataTransfer.getData("text/overlay-type");
        const id = event.dataTransfer.getData("text/overlay-block-id") || dragId;
        if (type) {
            const block = newBlock(type, position.x, position.y);
            layout = { ...layout, blocks: [...layout.blocks, block] };
            selectedId = block.id;
        } else if (id) {
            selectedId = id;
            patchSelected(position);
            dragId = null;
            return;
        }
        render();
    });
    saveButton.addEventListener("click", async () => {
        if (!configIsReady || !supabase) return showMessage("error", "Supabase ist noch nicht konfiguriert.");
        saveButton.disabled = true;
        try {
            const { error } = await supabase.from(VISITOR_OVERLAY_TABLE).upsert({
                kiosk_settings_id: VISITOR_OVERLAY_CONFIG_ID,
                layout: normalizeVisitorOverlayLayout(layout)
            }, { onConflict: "kiosk_settings_id" });
            if (error) throw error;
            layout = normalizeVisitorOverlayLayout(layout);
            showMessage("success", "Overlay gespeichert – die Änderung wird live auf den Kiosk übertragen.");
        } catch (error) {
            showMessage("error", error.message || "Overlay konnte nicht gespeichert werden.");
        } finally {
            saveButton.disabled = false;
        }
    });
    resetButton.addEventListener("click", () => {
        layout = normalizeVisitorOverlayLayout(DEFAULT_VISITOR_OVERLAY_LAYOUT);
        selectedId = null;
        render();
        showMessage("success", "Standardlayout geladen. Zum Übernehmen bitte speichern.");
    });

    async function load() {
        if (!configIsReady || !supabase) return;
        try {
            layout = await fetchVisitorOverlayLayout(supabase);
            selectedId = null;
            render();
        } catch (error) {
            showMessage("error", error.message || "Overlay-Konfiguration konnte nicht geladen werden.");
        }
    }

    render();
    return { load };
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));
}
