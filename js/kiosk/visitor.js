import { supabase as kioskSupabase, tableName as kioskTableName } from "../shared/supabase.js";
import { createVisitorDisplay } from "../shared/visitor-display.js";
import { getTodayIso } from "../shared/visit-dates.js";
import { fetchKioskSettings, subscribeKioskSettings, DEFAULT_DISPLAY_MODE, DEFAULT_ROTATE_INTERVAL_MS } from "../shared/kiosk-settings.js";

// ?demo=5 zeigt 5 Testbesucher ohne Datenbank, ?mode=stack erzwingt die gestapelte Ansicht,
// ?rotateSeconds=3 erzwingt ein Rotationsintervall. Zum Ausprobieren ohne Supabase-Zugriff,
// z. B. index.html?demo=6&mode=rotate&rotateSeconds=3
const params = new URLSearchParams(window.location.search);
const demoCount = Number(params.get("demo")) || 0;
const forcedMode = params.get("mode") === "stack" ? "stack" : (params.get("mode") === "rotate" ? "rotate" : null);
const forcedRotateMs = Number(params.get("rotateSeconds")) > 0 ? Number(params.get("rotateSeconds")) * 1000 : null;

function buildDemoVisitors(count) {
    const colors = ["e63946", "2a9d8f", "e9c46a", "264653", "f4a261", "9b5de5", "00b4d8", "ffb703"];
    return Array.from({ length: count }, (_, i) => ({
        id: `demo-${i}`,
        name: `Testfirma ${i + 1} GmbH`,
        imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#${colors[i % colors.length]}"/><text x="100" y="65" font-size="20" fill="#fff" text-anchor="middle" font-family="sans-serif">Logo ${i + 1}</text></svg>`
        )}`,
        template: ""
    }));
}

let display = null;
let currentVisitors = [];
let currentMode = forcedMode || DEFAULT_DISPLAY_MODE;
let currentRotateIntervalMs = forcedRotateMs || DEFAULT_ROTATE_INTERVAL_MS;

function getDisplay() {
    if (!display) {
        const panel = document.getElementById("visitor-panel");
        if (!panel) return null;
        display = createVisitorDisplay(panel);
    }
    return display;
}

export function updateVisitorPanel() {
    const activeDisplay = getDisplay();
    if (activeDisplay) {
        activeDisplay.update(currentVisitors, currentMode, currentRotateIntervalMs);
    }
}

export async function loadVisitorProfile() {
    if (demoCount > 0) {
        currentVisitors = buildDemoVisitors(demoCount);
        if (forcedMode) currentMode = forcedMode;
        if (forcedRotateMs) currentRotateIntervalMs = forcedRotateMs;
        updateVisitorPanel();
        return;
    }

    if (!kioskSupabase) {
        currentVisitors = [];
        updateVisitorPanel();
        return;
    }

    try {
        const [{ data, error }, settings] = await Promise.all([
            kioskSupabase
                .from(kioskTableName)
                .select("id, visitor_name, image_url, visitor_templates(message)")
                .contains("visit_date", [getTodayIso()]) // nur Besucher, die heute zu Besuch sind
                .order("updated_at", { ascending: false }),
            fetchKioskSettings(kioskSupabase)
        ]);

        if (error) {
            throw error;
        }

        currentVisitors = (data || []).map(visitor => ({
            id: visitor.id,
            name: visitor.visitor_name || "",
            imageUrl: visitor.image_url || "",
            template: visitor.visitor_templates?.message || ""
        }));
        currentMode = forcedMode || settings.mode;
        currentRotateIntervalMs = forcedRotateMs || settings.rotateIntervalMs;
    } catch (error) {
        // Anzeige bleibt bei einem Netzwerkfehler unverändert, sonst verschwinden die Besucher bis zum nächsten Abruf
        console.warn("Visitor profile load failed:", error.message || error);
        return;
    }

    updateVisitorPanel();
}

// Einmal beim Start aufrufen: reagiert sofort auf eine Änderung der Anzeige-Einstellung im Admin,
// ohne auf den nächsten 60-Sekunden-Abruf zu warten.
export function initVisitorRealtime() {
    if (demoCount > 0 || !kioskSupabase) {
        return;
    }
    subscribeKioskSettings(kioskSupabase, (settings) => {
        currentMode = forcedMode || settings.mode;
        currentRotateIntervalMs = forcedRotateMs || settings.rotateIntervalMs;
        updateVisitorPanel();
    });
}

// Für die Konsole/Tests: zeigt einen einzelnen Besucher ohne Datenbankabfrage
export function setvisitorName(text) {
    currentVisitors = [{ id: "manual", name: String(text || "").trim(), imageUrl: "", template: "" }];
    updateVisitorPanel();
}

// backward compatibility
export function setVisitorName(name) {
    setvisitorName(name);
}
