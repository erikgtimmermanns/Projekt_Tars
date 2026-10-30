export const VISITOR_OVERLAY_TABLE = "visitor_overlay_configs";
export const VISITOR_OVERLAY_CONFIG_ID = 1;

const GRID_COLUMNS = 12;
const GRID_ROWS = 12;
const BLOCK_TYPES = new Set(["text", "visitor-name", "visitor-logo", "image", "video"]);

export const DEFAULT_VISITOR_OVERLAY_LAYOUT = Object.freeze({
    version: 1,
    blocks: [
        { id: "visitor-logo", type: "visitor-logo", x: 1, y: 1, width: 4, height: 3 },
        { id: "welcome-title", type: "text", text: "Herzlich willkommen,", x: 5, y: 1, width: 7, height: 1, fontSize: "large" },
        { id: "visitor-name", type: "visitor-name", x: 5, y: 2, width: 7, height: 2, fontSize: "hero" },
        { id: "welcome-video", type: "video", src: "https://www.youtube.com/embed/wSGoUSwNb44?autoplay=1&mute=1&playsinline=1&controls=1&rel=0", x: 1, y: 5, width: 11, height: 7 }
    ]
});

function clamp(value, lower, upper) {
    const number = Math.round(Number(value));
    return Number.isFinite(number) ? Math.min(upper, Math.max(lower, number)) : lower;
}

function stringValue(value, maxLength = 2000) {
    return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function safeMediaUrl(value, type) {
    const url = stringValue(value, 3000).trim();
    if (!url) return "";
    try {
        const parsed = new URL(url, window.location.origin);
        if (parsed.protocol === "https:") return type === "video" ? normalizeVideoEmbedUrl(parsed) : parsed.href;
        return type === "image" && parsed.protocol === "data:" ? parsed.href : "";
    } catch {
        return "";
    }
}

// Redakteure kopieren häufig eine YouTube-/Vimeo-Seiten-URL statt der technischen
// Embed-URL. Die bekannten Formate werden deshalb beim Laden und Speichern
// verlustfrei in eine einbettbare Adresse überführt. Andere HTTPS-Embed-Anbieter
// bleiben unverändert.
function normalizeVideoEmbedUrl(url) {
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
        const id = url.pathname.split("/").filter(Boolean)[0];
        return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}${url.search}` : url.href;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
        if (url.pathname === "/watch" && url.searchParams.get("v")) {
            const id = url.searchParams.get("v");
            const parameters = new URLSearchParams(url.search);
            parameters.delete("v");
            const query = parameters.toString();
            return `https://www.youtube.com/embed/${encodeURIComponent(id)}${query ? `?${query}` : ""}`;
        }
        if (/^\/shorts\//.test(url.pathname)) {
            const id = url.pathname.split("/").filter(Boolean)[1];
            return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}${url.search}` : url.href;
        }
    }
    if (host === "vimeo.com") {
        const id = url.pathname.split("/").filter(Boolean)[0];
        return /^\d+$/.test(id || "") ? `https://player.vimeo.com/video/${id}${url.search}` : url.href;
    }
    return url.href;
}

export function normalizeVisitorOverlayLayout(value) {
    const source = value && typeof value === "object" ? value : DEFAULT_VISITOR_OVERLAY_LAYOUT;
    const inputBlocks = Array.isArray(source.blocks) ? source.blocks : DEFAULT_VISITOR_OVERLAY_LAYOUT.blocks;
    const usedIds = new Set();
    const blocks = inputBlocks.slice(0, 30).flatMap((block, index) => {
        if (!block || !BLOCK_TYPES.has(block.type)) return [];
        const idBase = stringValue(block.id, 80).replace(/[^a-zA-Z0-9_-]/g, "-") || `block-${index + 1}`;
        let id = idBase;
        let duplicate = 2;
        while (usedIds.has(id)) id = `${idBase}-${duplicate++}`;
        usedIds.add(id);
        const width = clamp(block.width, 1, GRID_COLUMNS);
        const height = clamp(block.height, 1, GRID_ROWS);
        return [{
            id,
            type: block.type,
            x: clamp(block.x, 1, GRID_COLUMNS - width + 1),
            y: clamp(block.y, 1, GRID_ROWS - height + 1),
            width,
            height,
            text: stringValue(block.text),
            src: safeMediaUrl(block.src, block.type),
            fontSize: ["normal", "large", "hero"].includes(block.fontSize) ? block.fontSize : "normal"
        }];
    });
    return { version: 1, blocks };
}

export async function fetchVisitorOverlayLayout(supabase) {
    if (!supabase) return normalizeVisitorOverlayLayout(DEFAULT_VISITOR_OVERLAY_LAYOUT);
    const { data, error } = await supabase
        .from(VISITOR_OVERLAY_TABLE)
        .select("layout")
        .eq("kiosk_settings_id", VISITOR_OVERLAY_CONFIG_ID)
        .maybeSingle();
    if (error) throw error;
    return normalizeVisitorOverlayLayout(data?.layout || DEFAULT_VISITOR_OVERLAY_LAYOUT);
}

export async function fetchVisitorOverlayConfiguration(supabase) {
    if (!supabase) {
        const fallback = normalizeVisitorOverlayLayout(DEFAULT_VISITOR_OVERLAY_LAYOUT);
        return { publishedLayout: fallback, draftLayout: fallback, updatedAt: null };
    }
    const { data, error } = await supabase
        .from(VISITOR_OVERLAY_TABLE)
        .select("layout, draft_layout, updated_at")
        .eq("kiosk_settings_id", VISITOR_OVERLAY_CONFIG_ID)
        .maybeSingle();
    if (error) throw error;
    const publishedLayout = normalizeVisitorOverlayLayout(data?.layout || DEFAULT_VISITOR_OVERLAY_LAYOUT);
    return {
        publishedLayout,
        draftLayout: normalizeVisitorOverlayLayout(data?.draft_layout || publishedLayout),
        updatedAt: data?.updated_at || null
    };
}

export function subscribeVisitorOverlayLayout(supabase, onChange) {
    if (!supabase) return () => {};
    const channel = supabase
        .channel("visitor_overlay_config_changes")
        .on("postgres_changes", {
            event: "*", schema: "public", table: VISITOR_OVERLAY_TABLE, filter: "kiosk_settings_id=eq.1"
        }, (payload) => onChange(normalizeVisitorOverlayLayout(payload.new?.layout || DEFAULT_VISITOR_OVERLAY_LAYOUT)))
        .subscribe();
    return () => supabase.removeChannel(channel);
}

function visitorTokenText(value, visitor) {
    return String(value || "").replaceAll("{{visitor.name}}", visitor?.name || "Besucher");
}

function blockElement(block, visitor) {
    const element = document.createElement("section");
    element.className = `visitor-overlay-block visitor-overlay-block--${block.type}`;
    element.dataset.overlayBlockId = block.id;
    element.style.gridColumn = `${block.x} / span ${block.width}`;
    element.style.gridRow = `${block.y} / span ${block.height}`;

    if (block.type === "visitor-logo") {
        if (visitor?.imageUrl) {
            const image = document.createElement("img");
            image.src = visitor.imageUrl;
            image.alt = `Logo ${visitor.name || "des Besuchers"}`;
            element.append(image);
        } else {
            element.textContent = "Logo";
        }
    } else if (block.type === "visitor-name" || block.type === "text") {
        const text = document.createElement(block.type === "visitor-name" ? "h1" : "p");
        text.className = `visitor-overlay-text visitor-overlay-text--${block.fontSize}`;
        text.textContent = block.type === "visitor-name" ? (visitor?.name || "Besucher") : visitorTokenText(block.text, visitor);
        element.append(text);
    } else if (block.type === "image") {
        if (block.src) {
            const image = document.createElement("img");
            image.src = block.src;
            image.alt = block.text || "Overlay-Bild";
            element.append(image);
        } else {
            element.textContent = "Bild auswählen";
        }
    } else if (block.type === "video") {
        if (block.src) {
            const frame = document.createElement("iframe");
            frame.src = block.src;
            frame.title = block.text || "Besucher-Video";
            frame.allow = "autoplay; encrypted-media; picture-in-picture";
            frame.allowFullscreen = true;
            frame.referrerPolicy = "strict-origin-when-cross-origin";
            element.append(frame);
        } else {
            element.textContent = "Video-URL einfügen";
        }
    }
    return element;
}

export function renderVisitorOverlay(container, layout, visitor = {}) {
    if (!container) return;
    const normalized = normalizeVisitorOverlayLayout(layout);
    const grid = document.createElement("div");
    grid.className = "visitor-overlay-grid";
    normalized.blocks.forEach((block) => grid.append(blockElement(block, visitor)));
    container.replaceChildren(grid);
}
