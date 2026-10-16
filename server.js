const express = require("express");

const app = express();
const port = Number(process.env.PORT) || 4173;
const overviewUrl = "https://seekampf.de/api/v1/stats/overview";
const cacheDurationMs = 5 * 60 * 1000;
const featuredTags = ["MTG", "AZB"];

let cachedSnapshot = null;
let cacheExpiresAt = 0;

function asNumber(value) {
    if (value == null || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeOverview(data) {
    if (!Array.isArray(data?.top_allianzen)) {
        throw new Error("Unerwartetes Seekampf-Antwortformat.");
    }

    const alliancesByTag = new Map(data.top_allianzen.map((alliance) => [String(alliance.tag).toUpperCase(), alliance]));
    const alliances = featuredTags.map((tag) => {
        const alliance = alliancesByTag.get(tag);
        if (!alliance) return null;

        return {
            id: asNumber(alliance.allianz_id),
            rank: asNumber(alliance.rang),
            tag: String(alliance.tag || tag),
            name: String(alliance.name || tag),
            members: asNumber(alliance.mitglieder),
            points: asNumber(alliance.punkte),
            dailyDelta: asNumber(alliance.differenz),
            rankChange: asNumber(alliance.rang_aenderung),
            flag: {
                icon: String(alliance.flagge?.icon || ""),
                color: String(alliance.flagge?.farbe || "")
            }
        };
    });

    return {
        updatedAt: new Date().toISOString(),
        stale: false,
        global: {
            players: asNumber(data.spieler_anzahl),
            islands: asNumber(data.inseln_anzahl),
            alliances: asNumber(data.allianzen_anzahl),
            fleets: asNumber(data.flotten_unterwegs)
        },
        featured: alliances
    };
}

async function getAllianceOverview() {
    if (cachedSnapshot && Date.now() < cacheExpiresAt) {
        return cachedSnapshot;
    }

    try {
        const response = await fetch(overviewUrl, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) throw new Error(`Seekampf antwortete mit HTTP ${response.status}.`);

        const snapshot = normalizeOverview(await response.json());
        cachedSnapshot = snapshot;
        cacheExpiresAt = Date.now() + cacheDurationMs;
        return snapshot;
    } catch (error) {
        if (cachedSnapshot) return { ...cachedSnapshot, stale: true };
        throw error;
    }
}

app.get("/api/alliances/featured", async (_request, response) => {
    try {
        response.set("Cache-Control", "no-store");
        response.json(await getAllianceOverview());
    } catch (error) {
        console.error("Seekampf-Statistik konnte nicht geladen werden:", error);
        if (error?.cause) console.error("Zusätzliche Fehlerursache:", error.cause);
        response.status(502).json({ error: "Seekampf-Statistik ist gerade nicht erreichbar." });
    }
});

app.use((request, response, next) => {
    const blockedPaths = ["/server.js", "/package.json", "/package-lock.json"];
    if (
        blockedPaths.includes(request.path)
        || request.path.startsWith("/node_modules/")
        || request.path.startsWith("/test/")
        || request.path.startsWith("/supabase/")
        || request.path.startsWith("/.git/")
    ) {
        response.sendStatus(404);
        return;
    }
    next();
});

app.use(express.static(__dirname, { dotfiles: "ignore", index: "index.html" }));

if (require.main === module) {
    app.listen(port, "0.0.0.0", () => {
        console.log(`Projekt Tars läuft auf http://localhost:${port}`);
    });
}

module.exports = { app, normalizeOverview };