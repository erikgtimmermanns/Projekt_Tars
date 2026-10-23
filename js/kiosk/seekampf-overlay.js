import { supabase } from "../shared/supabase.js";
import { subscribeKioskSettings } from "../shared/kiosk-settings.js";
import { setSeekampfLayoutState } from "./layout.js";
import {
    KIOSK_VIEW_ALLIANCE_COMPARISON,
    setKioskViewSelection,
    subscribeKioskSelection
} from "../shared/tablet-settings.js";

const numberFormat = new Intl.NumberFormat("de-DE");

function formatNumber(value) {
    return Number.isFinite(value) ? numberFormat.format(value) : "–";
}

function formatSignedNumber(value) {
    if (!Number.isFinite(value)) return "–";
    if (value > 0) return `+${formatNumber(value)}`;
    return formatNumber(value);
}

function formatGrowthPercent(value) {
    if (!Number.isFinite(value)) return "wird erfasst";
    return new Intl.NumberFormat("de-DE", {
        style: "percent",
        signDisplay: "always",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value / 100);
}

function createMetric(label, value) {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    wrapper.append(term, description);
    return wrapper;
}

function createAllianceCard(alliance, tag) {
    if (!alliance) {
        const empty = document.createElement("p");
        empty.className = "alliance-stat-empty";
        empty.textContent = `${tag} ist aktuell nicht in der öffentlichen Top-Allianzen-Liste enthalten.`;
        return empty;
    }

    const card = document.createElement("article");
    card.className = "alliance-stat-card";
    card.dataset.tag = tag;

    const heading = document.createElement("header");
    heading.className = "alliance-stat-heading";

    const flag = document.createElement("span");
    flag.textContent = alliance.flag?.icon || "⚓";

    const identity = document.createElement("div");
    identity.className = "alliance-stat-identity";
    const allianceTag = document.createElement("p");
    allianceTag.className = "alliance-stat-tag";
    allianceTag.textContent = `[${alliance.tag || tag}]`;
    const name = document.createElement("h3");
    name.className = "alliance-stat-name";
    name.textContent = alliance.name || tag;
    identity.append(allianceTag, name);

    const rank = document.createElement("span");
    rank.className = "alliance-stat-rank";
    rank.textContent = `Rang ${formatNumber(alliance.rank)}`;
    heading.append(flag, identity, rank);

    const points = document.createElement("div");
    points.className = "alliance-stat-points";
    const pointsValue = document.createElement("strong");
    pointsValue.textContent = formatNumber(alliance.points);
    const pointsLabel = document.createElement("span");
    pointsLabel.textContent = "Gesamtpunkte";
    points.append(pointsValue, pointsLabel);

    const metrics = document.createElement("dl");
    metrics.className = "alliance-stat-metrics";
    metrics.append(
        createMetric("Mitglieder", formatNumber(alliance.members)),
        createMetric("Heute", formatSignedNumber(alliance.dailyDelta)),
        createMetric("Wachstum (24 Std.)", formatGrowthPercent(alliance.growth24hPercent)),
        createMetric("Rangänderung", formatSignedNumber(alliance.rankChange)),
        createMetric(
            "Punkte / Mitglied",
            Number.isFinite(alliance.points) && Number.isFinite(alliance.members) && alliance.members > 0
                ? formatNumber(Math.round(alliance.points / alliance.members))
                : "–"
        )
    );

    card.append(heading, points, metrics);
    return card;
}

function renderStatistics(data, elements) {
    const [mtg, azb] = data.featured;
    elements.alliances.replaceChildren(
        createAllianceCard(mtg, "MTG"),
        createAllianceCard(azb, "AZB")
    );

    if (mtg && azb && Number.isFinite(mtg.points) && Number.isFinite(azb.points)) {
        const gap = Math.abs(mtg.points - azb.points);
        elements.pointGap.textContent = mtg.points === azb.points
            ? "MTG und AZB liegen bei den Punkten gleichauf."
            : `${mtg.points > azb.points ? "MTG" : "AZB"} liegt um ${formatNumber(gap)} Punkte vorn.`;
        elements.pointGap.hidden = false;
    } else {
        elements.pointGap.hidden = true;
    }

    const globalLabels = [
        ["Spieler", data.global.players],
        ["Bewohnte Inseln", data.global.islands],
        ["Allianzen", data.global.alliances],
        ["Flotten unterwegs", data.global.fleets]
    ];
    elements.serverMetrics.replaceChildren(...globalLabels.map(([label, value]) => {
        const metric = document.createElement("div");
        metric.className = "server-metric";
        const name = document.createElement("span");
        name.textContent = label;
        const amount = document.createElement("strong");
        amount.textContent = formatNumber(value);
        metric.append(name, amount);
        return metric;
    }));

    elements.statistics.hidden = false;
    elements.updatedAt.textContent = `Stand: ${new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(data.updatedAt))}${data.stale ? " (zwischengespeichert)" : ""}`;
    elements.status.dataset.stale = String(Boolean(data.stale));
    elements.status.classList.remove("error");
    elements.status.textContent = data.stale ? "Seekampf ist gerade nicht erreichbar; zuletzt geladene Werte werden gezeigt." : "";
    elements.status.hidden = !data.stale;
}

export function initSeekampfOverlay() {
    const dialog = document.getElementById("seekampf-dialog");
    const status = dialog?.querySelector("#seekampf-status");
    const statistics = dialog?.querySelector("#seekampf-statistics");
    const alliances = dialog?.querySelector("#featured-alliances");
    const pointGap = dialog?.querySelector("#alliance-point-gap");
    const serverMetrics = dialog?.querySelector("#server-metrics");
    const updatedAt = dialog?.querySelector("#seekampf-updated-at");
    if (!dialog || !status || !statistics || !alliances || !pointGap || !serverMetrics || !updatedAt) return;

    const pinnedPanel = document.getElementById("seekampf-pinned-panel");
    const screen = document.querySelector(".screen");
    const pinnedElements = {
        status: document.getElementById("seekampf-pinned-status"),
        statistics: document.getElementById("seekampf-pinned-statistics"),
        alliances: document.getElementById("seekampf-pinned-alliances"),
        pointGap: document.getElementById("seekampf-pinned-point-gap"),
        serverMetrics: document.getElementById("seekampf-pinned-server-metrics"),
        updatedAt: document.getElementById("seekampf-pinned-updated-at")
    };
    if (!pinnedPanel || !screen || Object.values(pinnedElements).some((element) => !element)) return;

    let isActive = false;
    let isPinned = false;
    let pinnedStatisticsReady = false;
    let requestSequence = 0;
    const elements = { status, statistics, alliances, pointGap, serverMetrics, updatedAt };

    const loadStatistics = async (target = elements) => {
        const currentRequest = ++requestSequence;
        const isPinnedTarget = target === pinnedElements;
        if (isPinnedTarget) {
            pinnedStatisticsReady = false;
            setSeekampfLayoutState(isPinned, false);
        }
        target.status.hidden = false;
        target.status.dataset.stale = "false";
        target.status.classList.remove("error");
        target.status.textContent = "Statistik wird geladen ...";
        target.statistics.setAttribute("aria-busy", "true");

        try {
            const response = await fetch("/api/alliances/featured", { cache: "no-store" });
            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                throw new Error("API-Server fehlt. Bitte im Projektordner `npm start` ausführen und die Seite über Port 4173 öffnen.");
            }
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
            if (currentRequest !== requestSequence) return;
            renderStatistics(data, target);
            if (isPinnedTarget) {
                pinnedStatisticsReady = true;
                setSeekampfLayoutState(isPinned, true);
            }
        } catch (error) {
            if (currentRequest !== requestSequence) return;
            target.status.dataset.stale = "false";
            target.status.classList.add("error");
            target.status.textContent = error.message || "Statistik konnte nicht geladen werden.";
            target.updatedAt.textContent = "";
            if (isPinnedTarget) {
                pinnedStatisticsReady = false;
                setSeekampfLayoutState(isPinned, false);
            }
        } finally {
            if (currentRequest === requestSequence) {
                target.statistics.removeAttribute("aria-busy");
            }
        }
    };

    const applySelection = (selection) => {
        const shouldShowDialog = !isPinned && selection.kioskView === KIOSK_VIEW_ALLIANCE_COMPARISON;
        const wasActive = isActive;
        isActive = shouldShowDialog;

        if (isActive) {
            if (!dialog.open) dialog.showModal();
            if (!wasActive) void loadStatistics();
        } else if (dialog.open) {
            dialog.close();
        }
    };

    let latestSelection = { kioskView: null };
    const onSelection = (selection) => {
        latestSelection = selection;
        applySelection(selection);
    };
    const unsubscribe = subscribeKioskSelection(supabase, onSelection);
    const unsubscribeSettings = subscribeKioskSettings(supabase, (settings) => {
        const wasPinned = isPinned;
        isPinned = settings.seekampfPinned;
        setSeekampfLayoutState(isPinned, pinnedStatisticsReady);
        if (isPinned && !wasPinned) void loadStatistics(pinnedElements);
        applySelection(latestSelection);
    });
    dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
    });
    dialog.addEventListener("close", () => {
        if (!isActive) return;
        isActive = false;
        requestSequence++;
        void setKioskViewSelection(supabase, null);
    });

    return () => {
        unsubscribe();
        unsubscribeSettings();
        if (dialog.open) dialog.close();
    };
}
