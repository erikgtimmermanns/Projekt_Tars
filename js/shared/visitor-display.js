// visitor_panel: Mehrfachanzeige für den Kiosk. Bei genau einem Besucher sehen beide Modi
// aus wie eine normale Einzel-Box (renderVisitorPanel). Ab zwei Besuchern:
//  - "rotate": eine Box + Logo-Leiste, Wechsel alle ROTATE_INTERVAL_MS
//  - "stack":  eine Box pro Besucher, oberste Position wechselt alle STACK_INTERVAL_MS
import { createVisitorBox, fillVisitorBox } from "./visitor-panel.js";
import { DEFAULT_ROTATE_INTERVAL_MS } from "./kiosk-settings.js";

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

    function renderEmpty() {
        stopTimer();
        panel.hidden = true;
        panel.replaceChildren();
    }

    // Einzelner Besucher: einfache Box, kein Rahmen-Layout, kein Timer — wie vor der Mehrfachanzeige
    function renderSingle(visitor) {
        stopTimer();
        panel.hidden = false;
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

    function rotateStackOrder(root) {
        const children = [...root.children];
        const startRects = new Map(children.map(el => [el, el.getBoundingClientRect()]));

        const first = children[0];
        stackOrder.push(stackOrder.shift());
        root.appendChild(first); // wandert ans Ende, die übrigen rücken optisch nach oben

        root.querySelectorAll(".visitor-box").forEach(el => {
            const startRect = startRects.get(el);
            const endRect = el.getBoundingClientRect();
            const deltaY = startRect.top - endRect.top;
            if (deltaY && typeof el.animate === "function") {
                el.animate(
                    [{ transform: `translateY(${deltaY}px)` }, { transform: "translateY(0)" }],
                    { duration: 600, easing: "cubic-bezier(.2,.8,.2,1)" }
                );
            }
        });
    }

    function renderStack(freshStart) {
        panel.hidden = false;
        let root = panel.children.length === 1 ? panel.firstElementChild : null;
        if (!root || !root.classList.contains("visitor-stack")) {
            root = document.createElement("div");
            root.className = "visitor-stack";
            panel.replaceChildren(root);
            freshStart = true;
        }

        const compact = visitors.length >= 4;
        root.classList.toggle("compact", compact);
        root.style.setProperty("--visitor-message-size", compact ? STACK_COMPACT_MESSAGE_SIZE : "");

        const byId = new Map(visitors.map(v => [String(v.id), v]));
        const existing = new Map([...root.children].map(el => [el.dataset.visitorId, el]));

        stackOrder.forEach(id => {
            const visitor = byId.get(id);
            if (!visitor) return;
            let box = existing.get(id);
            if (!box) {
                box = createVisitorBox();
                box.dataset.visitorId = id;
            }
            fillVisitorBox(box, visitor);
            root.appendChild(box); // in stackOrder-Reihenfolge ans Ende hängen sortiert die Boxen neu
            existing.delete(id);
        });
        existing.forEach(box => box.remove()); // Besucher, die heute nicht mehr in der Liste sind

        if (visitors.length < 2) {
            stopTimer();
            return;
        }

        if (!freshStart) {
            return;
        }

        stopTimer();
        timer = setInterval(() => rotateStackOrder(root), STACK_INTERVAL_MS);
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
            renderStack(isFreshStart);
        } else {
            renderRotate(isFreshStart);
        }
    }

    return { update };
}
