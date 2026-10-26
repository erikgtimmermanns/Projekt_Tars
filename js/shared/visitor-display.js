// visitor_panel: Mehrfachanzeige für den Kiosk. Bei genau einem Besucher sehen beide Modi
// aus wie eine normale Einzel-Box (renderVisitorPanel). Ab zwei Besuchern:
//  - "rotate": eine Box + Logo-Leiste, Wechsel alle ROTATE_INTERVAL_MS
//  - "stack":  passende Boxen bleiben sichtbar; nur überzählige rotieren im letzten Platz
import { createVisitorBox, fillVisitorBox } from "./visitor-panel.js";
import { DEFAULT_ROTATE_INTERVAL_MS } from "./kiosk-settings.js";
import { loadVisitorProfile } from "../kiosk/visitor.js";

const STACK_INTERVAL_MS = 10000;
const STACK_COMPACT_MESSAGE_SIZE = "22px";

function sameVisitorIds(a, b) {
    if (a.length !== b.length) return false;
    const idsA = a.map(v => String(v.id)).sort();
    const idsB = b.map(v => String(v.id)).sort();
    return idsA.every((id, i) => id === idsB[i]);
}

export function createVisitorDisplay(panel) {
    let mode = null;
    let rotateIntervalMs = DEFAULT_ROTATE_INTERVAL_MS;
    let visitors = [];
    let rotateIndex = 0;
    let stackOrder = []; // Besucher-IDs (als String) in aktueller Anzeigereihenfolge
    let timer = null;
    let progressAnim = null;

    // Hilfsfunktion: stoppt alte timer, bevor neue gesetzt werden
    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        if (progressAnim) {
            progressAnim.cancel();
            progressAnim = null;
        }
    }

    // lässt visitor_panel verschwinden (Kein Besucher)/
    function renderEmpty() {
        stopTimer();
        panel.hidden = true;
        panel.classList.remove("visitor-panel--single", "visitor-panel--rotate", "visitor-panel--stack");
        panel.replaceChildren();
    }

    // Einzelner Besucher: einfache Box, kein Rahmen-Layout, kein Timer — wie vor der Mehrfachanzeige
    function renderSingle(visitor) {
        stopTimer();
        panel.hidden = false;
        panel.classList.remove("visitor-panel--rotate", "visitor-panel--stack");
        panel.classList.add("visitor-panel--single");
        const onlyChild = panel.children.length === 1 ? panel.firstElementChild : null;
        const box = (onlyChild && onlyChild.classList.contains("visitor-box")) ? onlyChild : createVisitorBox();
        if (box !== onlyChild) {
            panel.replaceChildren(box);
        }
        fillVisitorBox(box, visitor);
    }

    // --- Rotation ---------------------------------------------------------

    function updateRailTiles(rail) {
        rail.hidden = visitors.length < 2;
        rail.classList.toggle("compact", visitors.length > 3); // >3 Besucher: zwei Spalten, kleinere Kacheln
        rail.replaceChildren(...visitors.map((visitor, index) => {
            const tile = document.createElement("div");
            tile.className = "visitor-rail-tile" + (index === rotateIndex ? " active" : "");
            if (visitor.imageUrl) {
                tile.style.backgroundImage = `url(${JSON.stringify(visitor.imageUrl)})`;
            }
            return tile;
        }));
    }

    function startFillAnimation(progressEl) {
        if (progressAnim) progressAnim.cancel();
        if (typeof progressEl.animate !== "function") return; // sehr alte Browser: kein Fortschrittsbalken, funktioniert sonst normal
        progressAnim = progressEl.animate(
            [{ width: "0%" }, { width: "100%" }],
            { duration: rotateIntervalMs, easing: "linear", fill: "forwards" }
        );
    }

    function renderRotate(freshStart) {
        panel.hidden = false;
        panel.classList.remove("visitor-panel--single", "visitor-panel--stack");
        panel.classList.add("visitor-panel--rotate");
        let root = panel.children.length === 1 ? panel.firstElementChild : null;
        let rail, box;
        if (!root || !root.classList.contains("visitor-rotate")) {
            root = document.createElement("div");
            root.className = "visitor-rotate";
            rail = document.createElement("div");
            rail.className = "visitor-rail";
            const wrap = document.createElement("div");
            wrap.className = "visitor-box-wrap";
            box = createVisitorBox();
            wrap.appendChild(box);
            root.append(rail, wrap);
            panel.replaceChildren(root);
            freshStart = true; // Struktur war nicht da, der Zyklus muss so oder so neu beginnen
        } else {
            rail = root.querySelector(".visitor-rail");
            box = root.querySelector(".visitor-box");
        }

        updateRailTiles(rail);
        fillVisitorBox(box, visitors[rotateIndex]);

        if (visitors.length < 2) {
            stopTimer();
            return;
        }

        if (!freshStart) {
            return; // nur Inhalte aktualisiert (z. B. neuer Name aus dem Admin) — laufender Zyklus bleibt unangetastet
        }

        stopTimer();
        const progress = box.querySelector(".visitor-box-progress");
        startFillAnimation(progress);
        timer = setInterval(() => {
            rotateIndex = (rotateIndex + 1) % visitors.length;
            updateRailTiles(rail);
            fillVisitorBox(box, visitors[rotateIndex]);
            startFillAnimation(progress);
        }, rotateIntervalMs);
    }

    // --- Stapel -------------------------------------------------------------

    function renderStack() {
        panel.hidden = false;
        panel.classList.remove("visitor-panel--single", "visitor-panel--rotate");
        panel.classList.add("visitor-panel--stack");
        let root = panel.children.length === 1 ? panel.firstElementChild : null;
        if (!root || !root.classList.contains("visitor-stack")) {
            root = document.createElement("div");
            root.className = "visitor-stack";
            panel.replaceChildren(root);
        }

        const compact = visitors.length >= 4;
        root.classList.toggle("compact", compact);
        root.style.setProperty("--visitor-message-size", compact ? STACK_COMPACT_MESSAGE_SIZE : "");

        const byId = new Map(visitors.map(v => [String(v.id), v]));
        const existing = new Map([...root.children].map(el => [el.dataset.visitorId, el]));
        const boxes = new Map();

        stackOrder.forEach(id => {
            const visitor = byId.get(id);
            if (!visitor) return;
            let box = existing.get(id);
            if (!box) {
                box = createVisitorBox();
                box.dataset.visitorId = id;
            }
            fillVisitorBox(box, visitor);
            root.appendChild(box);
            boxes.set(id, box);
            existing.delete(id);
        });
        existing.forEach(box => box.remove());

        const gap = Number.parseFloat(getComputedStyle(root).rowGap) || 0;
        const availableHeight = panel.clientHeight;
        let usedHeight = 0;
        let fittingCount = 0;
        for (const id of stackOrder) {
            const boxHeight = boxes.get(id)?.getBoundingClientRect().height || 0;
            const nextHeight = usedHeight + (fittingCount ? gap : 0) + boxHeight;
            if (fittingCount && nextHeight > availableHeight) break;
            usedHeight = nextHeight;
            fittingCount++;
        }
        fittingCount = Math.max(1, fittingCount);

        const visibleCount = Math.min(visitors.length, fittingCount);
        const hasOverflow = visitors.length > visibleCount;
        const pinnedCount = hasOverflow ? visibleCount - 1 : visibleCount;
        const pinnedBoxes = stackOrder.slice(0, pinnedCount).map(id => boxes.get(id)).filter(Boolean);
        const overflowIds = hasOverflow ? stackOrder.slice(pinnedCount) : [];
        const overflowBoxes = new Map(overflowIds.map(id => [id, boxes.get(id)]));
        let overflowIndex = 0;

        stopTimer();
        if (overflowIds.length) {
            root.replaceChildren(...pinnedBoxes, overflowBoxes.get(overflowIds[overflowIndex]));
            if (overflowIds.length > 1) {
                timer = setInterval(() => {
                    overflowIndex = (overflowIndex + 1) % overflowIds.length;
                    const nextId = overflowIds[overflowIndex];
                    const nextBox = overflowBoxes.get(nextId);
                    fillVisitorBox(nextBox, byId.get(nextId));
                    root.replaceChildren(...pinnedBoxes, nextBox);
                }, STACK_INTERVAL_MS);
            }
        } else {
            root.replaceChildren(...stackOrder.slice(0, visibleCount).map(id => boxes.get(id)).filter(Boolean));
        }
    }

    // --- Öffentliche API ------------------------------------------------------

    function update(newVisitors, newMode, newRotateIntervalMs) {
        const list = Array.isArray(newVisitors) ? newVisitors : [];
        const nextRotateIntervalMs = Number(newRotateIntervalMs) > 0 ? Number(newRotateIntervalMs) : DEFAULT_ROTATE_INTERVAL_MS;
        const rotateIntervalChanged = nextRotateIntervalMs !== rotateIntervalMs;
        rotateIntervalMs = nextRotateIntervalMs;

        if (list.length === 0) {
            visitors = [];
            stackOrder = [];
            rotateIndex = 0;
            mode = newMode;
            renderEmpty();
            return;
        }

        // Ein geändertes Rotationsintervall soll nur die Rotation neu starten, nicht den unabhängigen Stapel-Zyklus
        // Due zentrale Schnittstelle nach außen. Sie:

        // nimmt neue Besucherliste
        // prüft, ob Modus oder Intervall geändert wurde
        // setzt Zustände zurück, falls nötig
        // rendert leer, einzeln, rotation oder stack
        // startet oder stoppt Timer entsprechend
        const isFreshStart = newMode !== mode || !sameVisitorIds(list, visitors)
            || (newMode === "rotate" && rotateIntervalChanged);
        if (isFreshStart) {
            rotateIndex = 0;
            stackOrder = list.map(v => String(v.id));
        }

        visitors = list;
        mode = newMode;

        if (visitors.length === 1) {
            renderSingle(visitors[0]);
            return;
        }

        if (mode === "stack") {
            renderStack();
        } else {
            renderRotate(isFreshStart);
        }
    }

    return { update };
}
