const express = require("express");

const app = express();
const port = Number(process.env.PORT) || 4173;
const overviewUrl = "https://seekampf.de/api/v1/stats/overview";
const cacheDurationMs = 5 * 60 * 1000;
const snapshotIntervalMs = 15 * 60 * 1000;
const historyWindowMs = 24 * 60 * 60 * 1000;
const snapshotRetentionMs = 45 * 24 * 60 * 60 * 1000;
const featuredTags = ["MTG", "AZB"];
const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const hasSnapshotStorage = Boolean(supabaseUrl && supabaseServiceRoleKey);

let cachedSnapshot = null;
let cacheExpiresAt = 0;
let refreshInFlight = null;
let lastSnapshotCleanupAt = 0;

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

async function supabaseSnapshotRequest(path, options = {}) {
    if (!hasSnapshotStorage) throw new Error("SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt.");

    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
        ...options,
        headers: {
            apikey: supabaseServiceRoleKey,
            Authorization: `Bearer ${supabaseServiceRoleKey}`,
            "Content-Type": "application/json",
            ...options.headers
        },
        signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) {
        const details = await response.text();
        throw new Error(`Supabase Snapshot-Speicher antwortete mit HTTP ${response.status}: ${details}`);
    }
    if (response.status === 204) return null;
    return response.json();
}

async function storeAllianceSnapshot(snapshot) {
    if (!hasSnapshotStorage) {
        if (!storeAllianceSnapshot.warned) {
            console.warn("24-Stunden-Wachstum ist deaktiviert: SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen für den Server gesetzt sein.");
            storeAllianceSnapshot.warned = true;
        }
        return;
    }

    const capturedAt = snapshot.updatedAt;
    const rows = snapshot.featured
        .filter((alliance) => alliance && Number.isFinite(alliance.points))
        .map((alliance) => ({ alliance_tag: alliance.tag.toUpperCase(), points: alliance.points, captured_at: capturedAt }));
    if (!rows.length) return;

    await supabaseSnapshotRequest("kiosk_alliance_snapshots", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(rows)
    });

    const cutoff = new Date(Date.parse(capturedAt) - historyWindowMs).toISOString();
    await Promise.all(snapshot.featured.map(async (alliance) => {
        if (!alliance || !Number.isFinite(alliance.points)) return;
        const query = new URLSearchParams({
            select: "points,captured_at",
            alliance_tag: `eq.${alliance.tag.toUpperCase()}`,
            captured_at: `lte.${cutoff}`,
            order: "captured_at.desc",
            limit: "1"
        });
        const history = await supabaseSnapshotRequest(`kiosk_alliance_snapshots?${query}`);
        const previous = history?.[0];
        if (!previous || !(Number(previous.points) > 0)) {
            alliance.growth24hPoints = null;
            alliance.growth24hPercent = null;
            alliance.growth24hComparedAt = null;
            return;
        }

        const growthPoints = alliance.points - Number(previous.points);
        alliance.growth24hPoints = growthPoints;
        alliance.growth24hPercent = Number(((growthPoints / Number(previous.points)) * 100).toFixed(2));
        alliance.growth24hComparedAt = previous.captured_at;
    }));

    if (Date.now() - lastSnapshotCleanupAt >= 24 * 60 * 60 * 1000) {
        const retentionCutoff = new Date(Date.now() - snapshotRetentionMs).toISOString();
        const cleanupQuery = new URLSearchParams({ captured_at: `lt.${retentionCutoff}` });
        await supabaseSnapshotRequest(`kiosk_alliance_snapshots?${cleanupQuery}`, {
            method: "DELETE",
            headers: { Prefer: "return=minimal" }
        });
        lastSnapshotCleanupAt = Date.now();
    }
}

async function refreshAllianceOverview() {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
        const response = await fetch(overviewUrl, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) throw new Error(`Seekampf antwortete mit HTTP ${response.status}.`);

        const snapshot = normalizeOverview(await response.json());
        try {
            await storeAllianceSnapshot(snapshot);
        } catch (error) {
            console.error("Seekampf-Messwerte konnten nicht in Supabase gespeichert werden:", error);
        }
        cachedSnapshot = snapshot;
        cacheExpiresAt = Date.now() + cacheDurationMs;
        return snapshot;
    })();

    try {
        return await refreshInFlight;
    } finally {
        refreshInFlight = null;
    }
}

async function getAllianceOverview() {
    if (cachedSnapshot && Date.now() < cacheExpiresAt) return cachedSnapshot;
    try {
        return await refreshAllianceOverview();
    } catch (error) {
        if (cachedSnapshot) return { ...cachedSnapshot, stale: true };
        throw error;
    }
}

function startAllianceSnapshotCollection() {
    if (!hasSnapshotStorage) {
        console.warn("Die Seekampf-24-Stunden-Historie ist nicht aktiv. SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY fehlen.");
        return;
    }
    const collect = () => refreshAllianceOverview().catch((error) => {
        console.error("Seekampf-Messung konnte nicht aktualisiert werden:", error);
    });
    void collect();
    const timer = setInterval(collect, snapshotIntervalMs);
    timer.unref?.();
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
        startAllianceSnapshotCollection();
    });
}

module.exports = { app, normalizeOverview };
