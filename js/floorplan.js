const floorplans = [

    {
        name: "Erdgeschoss",
        image: "./assets/floorplans/Raumplan_Erdgeschoss.png",
        hotspots: [
            { id: 'elevator', label: 'Aufzug', x: 12, y: 62, type: 'elevator' },
            { id: 'exit-south', label: 'Notausgang (Süd)', x: 92, y: 78, type: 'exit' },
            { id: 'reception', label: 'Empfang', x: 44, y: 70, type: 'info' },
            { id: 'wc', label: 'Toiletten', x: 22, y: 42, type: 'restroom' }
        ]
    },

    {
        name: "1. Obergeschoss",
        image: "./assets/floorplans/Raumplan_1OG.png",
        hotspots: [
            { id: 'stairs-1', label: 'Treppenhaus', x: 8, y: 36, type: 'stairs' },
            { id: 'meeting-101', label: 'Besprechungsraum 101', x: 58, y: 40, type: 'meeting' },
            { id: 'exit-west', label: 'Notausgang (West)', x: 4, y: 8, type: 'exit' }
        ]
    },

    {
        name: "2. Obergeschoss",
        image: "./assets/floorplans/Raumplan_2OG.png",
        hotspots: [
            { id: 'meeting-201', label: 'Besprechungsraum 201', x: 50, y: 50, type: 'meeting' },
            { id: 'server', label: 'Serverraum (gesperrt)', x: 80, y: 30, type: 'important' }
        ]
    },

    {
        name: "3. Obergeschoss",
        image: "./assets/floorplans/Raumplan_3OG.png",
        hotspots: [
            { id: 'exit-north', label: 'Notausgang (Nord)', x: 92, y: 12, type: 'exit' }
        ]
    }

];

let currentFloor = 0;

function rotateFloorplan() {

    const image =
        document.getElementById(
            "floorplan-image"
        );

    const title =
        document.getElementById(
            "floorplan-name"
        );

    if (!image || !title) {
        return;
    }

    image.style.opacity = 0;

    setTimeout(() => {

        currentFloor++;

        if (
            currentFloor >=
            floorplans.length
        ) {
            currentFloor = 0;
        }


        // Wechsel Bild, und warte auf load bevor Marker gerendert werden
        image.src = floorplans[currentFloor].image;
        title.textContent = floorplans[currentFloor].name;

        image.onload = () => {
            renderFloorplanMarkers(currentFloor);
            image.style.opacity = 1;
        };

    }, 500);
}

setInterval(
    rotateFloorplan,
    10000
);

// ----------------------------
// Marker Rendering
// ----------------------------

function iconForType(type) {
    const map = {
        elevator: './assets/icons/elevator.svg',
        exit: './assets/icons/exit.svg',
        info: './assets/icons/info.svg',
        restroom: './assets/icons/restroom.svg',
        stairs: './assets/icons/stairs.svg',
        meeting: './assets/icons/meeting.svg',
        important: './assets/icons/important.svg'
    };

    return map[type] || './assets/icons/important.svg';
}

function renderFloorplanMarkers(floorIndex) {
    const overlay = document.getElementById('floorplan-overlay');

    const image = document.getElementById('floorplan-image');
    const planStage = image ? image.closest('.plan-stage') : null;

    if (!overlay || !image || !planStage) return;

    // Bestimme Bild-Position und Größe relativ zur plan-stage
    const imgRect = image.getBoundingClientRect();
    const stageRect = planStage.getBoundingClientRect();

    const relLeft = imgRect.left - stageRect.left;
    const relTop = imgRect.top - stageRect.top;

    overlay.style.left = relLeft + 'px';
    overlay.style.top = relTop + 'px';
    overlay.style.width = imgRect.width + 'px';
    overlay.style.height = imgRect.height + 'px';

    overlay.innerHTML = '';

    const fp = floorplans[floorIndex];
    if (!fp || !fp.hotspots) return;

    // compute content bounding box (non-transparent pixels) for current image
    // cache result on floorplan object to avoid repeated work
    async function getContentBox(img, fp) {
        if (fp._contentBox) return fp._contentBox;

        const w = img.naturalWidth;
        const h = img.naturalHeight;

        if (!w || !h) {
            // fallback: whole image
            fp._contentBox = { x: 0, y: 0, width: w || 1, height: h || 1 };
            return fp._contentBox;
        }

        try {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const data = ctx.getImageData(0, 0, w, h).data;

            let minX = w, minY = h, maxX = 0, maxY = 0;
            let found = false;
            for (let y = 0; y < h; y += 2) { // sample every 2 rows for speed
                for (let x = 0; x < w; x += 2) {
                    const idx = (y * w + x) * 4;
                    const alpha = data[idx + 3];
                    if (alpha > 10) {
                        found = true;
                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        if (x > maxX) maxX = x;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (!found) {
                fp._contentBox = { x: 0, y: 0, width: w, height: h };
            } else {
                // expand bounds a bit for safety
                minX = Math.max(0, minX - 2);
                minY = Math.max(0, minY - 2);
                maxX = Math.min(w - 1, maxX + 2);
                maxY = Math.min(h - 1, maxY + 2);
                fp._contentBox = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
            }

            return fp._contentBox;
        } catch (e) {
            // if any error (CORS, etc.) fall back to full image
            fp._contentBox = { x: 0, y: 0, width: w, height: h };
            return fp._contentBox;
        }
    }

    (async () => {
        const contentBox = await getContentBox(image, fp);

        fp.hotspots.filter(h => h.type === 'elevator' || h.type === 'restroom').forEach(h => {
        // inside async loop now
        const marker = document.createElement('button');
        marker.className = 'fp-marker';
        marker.type = 'button';
        marker.setAttribute('aria-label', h.label);

        // position mapping: interpret hotspot x/y as percent inside the image CONTENT BOX
        // compute natural coordinate inside full image
        const natX = contentBox.x + (h.x / 100) * contentBox.width;
        const natY = contentBox.y + (h.y / 100) * contentBox.height;

        // map natural coordinate to displayed image pixel
        const px = (natX / image.naturalWidth) * imgRect.width;
        const py = (natY / image.naturalHeight) * imgRect.height;

        marker.style.left = px + 'px';
        marker.style.top = py + 'px';

        // set background color for exits / important
        if (h.type === 'exit') {
            marker.style.background = 'linear-gradient(180deg,#ff6b6b,#ff3b3b)';
        } else if (h.type === 'important' || h.type === 'server') {
            marker.style.background = 'linear-gradient(180deg,#ffb84d,#ff9a1f)';
        } else {
            marker.style.background = ''; // use default
        }

        const img = document.createElement('img');
        img.src = iconForType(h.type);
        img.alt = h.label;
        img.loading = 'lazy';
        img.className = 'fp-marker-img';

        const label = document.createElement('span');
        label.className = 'fp-label';
        label.textContent = h.label;

        marker.appendChild(img);
        marker.appendChild(label);

        marker.addEventListener('click', (ev) => {
            ev.stopPropagation();
            console.log('Hotspot angeklickt:', h);
            marker.animate([
                { transform: 'translate(-50%,-50%) scale(1.12)' },
                { transform: 'translate(-50%,-50%) scale(1)' }
            ], { duration: 300 });

            // show editor panel with nudge controls
            const contentBoxLocal = contentBox; // closure
            showHotspotEditor(h, marker, overlay, image, contentBoxLocal);
        });

        overlay.appendChild(marker);
        });
    })();
}

// ----------------------------
// Dragging + Persistence (top-level)
// ----------------------------

function enableMarkerDragging(overlay, image) {
    if (!overlay) return;

    let dragging = null;

    const onPointerMove = (ev) => {
        if (!dragging) return;
        const rect = overlay.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        const w = rect.width;
        const h = rect.height;

        const clampedX = Math.max(0, Math.min(w, x));
        const clampedY = Math.max(0, Math.min(h, y));

        dragging.style.left = clampedX + 'px';
        dragging.style.top = clampedY + 'px';

        // update associated hotspot in fp data
        const fp = overlay._fp;
        const contentBox = overlay._contentBox;
        if (fp && contentBox) {
            const natX = (clampedX / w) * image.naturalWidth;
            const natY = (clampedY / h) * image.naturalHeight;

            const newPercentX = ((natX - contentBox.x) / contentBox.width) * 100;
            const newPercentY = ((natY - contentBox.y) / contentBox.height) * 100;

            const id = dragging.dataset.hotspotId;
            const hh = fp.hotspots.find(z => z.id === id);
            if (hh) {
                hh.x = Math.max(0, Math.min(100, Number(newPercentX.toFixed(2))));
                hh.y = Math.max(0, Math.min(100, Number(newPercentY.toFixed(2))));
                // update editor display if this is selected
                if (overlay._selectedHotspotId === id) {
                    updateHotspotEditorDisplay(hh);
                }
            }
        }
    };

    const onPointerUp = (ev) => {
        if (!dragging) return;
        dragging.classList.remove('dragging');
        try { dragging.releasePointerCapture(ev.pointerId); } catch (e) {}
        dragging = null;
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
    };

    overlay.querySelectorAll('.fp-marker').forEach(marker => {
        marker.addEventListener('pointerdown', (ev) => {
            ev.preventDefault();
            marker.setPointerCapture(ev.pointerId);
            dragging = marker;
            marker.classList.add('dragging');
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        });
    });
}

function saveHotspotsToLocal() {
    try {
        const data = JSON.stringify(floorplans, null, 2);
        localStorage.setItem('floorplan_hotspots_v1', data);
        return true;
    } catch (e) {
        console.error('Saving hotspots failed', e);
        return false;
    }
}

function exportHotspots() {
    const data = JSON.stringify(floorplans, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hotspots.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function loadHotspotsFromLocal() {
    try {
        const raw = localStorage.getItem('floorplan_hotspots_v1');
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        // basic merge: replace hotspots arrays where present
        parsed.forEach((p, idx) => {
            if (p && p.hotspots && floorplans[idx]) {
                floorplans[idx].hotspots = p.hotspots;
            }
        });
        return true;
    } catch (e) {
        console.error('Loading hotspots failed', e);
        return false;
    }
}

function showHotspotEditor(h, marker, overlay, image, contentBox) {
    const info = document.getElementById('fp-info');
    if (!info) return;

    overlay._selectedHotspotId = h.id;

    info.innerHTML = `
        <h4>${h.label}</h4>
        <p>Typ: ${h.type}</p>
        <p>ID: ${h.id}</p>
        <div class="fp-pos">Position: <span id="fp-pos-x">${h.x}%</span>, <span id="fp-pos-y">${h.y}%</span></div>
        <div class="fp-nudge">
            <div>
                <button id="nudge-x-dec">◀ -0.5%</button>
                <button id="nudge-x-inc">▶ +0.5%</button>
            </div>
            <div>
                <button id="nudge-y-dec">▲ -0.5%</button>
                <button id="nudge-y-inc">▼ +0.5%</button>
            </div>
        </div>
    `;

    info.style.display = 'block';
    info.setAttribute('aria-hidden','false');

    function setAndRender(newX, newY) {
        h.x = Math.max(0, Math.min(100, Number(newX.toFixed(2))));
        h.y = Math.max(0, Math.min(100, Number(newY.toFixed(2))));

        // re-render marker position
        const imgRect = image.getBoundingClientRect();
        const natX = contentBox.x + (h.x / 100) * contentBox.width;
        const natY = contentBox.y + (h.y / 100) * contentBox.height;
        const px = (natX / image.naturalWidth) * imgRect.width;
        const py = (natY / image.naturalHeight) * imgRect.height;
        marker.style.left = px + 'px';
        marker.style.top = py + 'px';

        updateHotspotEditorDisplay(h);
    }

    document.getElementById('nudge-x-dec').addEventListener('click', () => setAndRender(h.x - 0.5, h.y));
    document.getElementById('nudge-x-inc').addEventListener('click', () => setAndRender(h.x + 0.5, h.y));
    document.getElementById('nudge-y-dec').addEventListener('click', () => setAndRender(h.x, h.y - 0.5));
    document.getElementById('nudge-y-inc').addEventListener('click', () => setAndRender(h.x, h.y + 0.5));
}

function updateHotspotEditorDisplay(h) {
    const xEl = document.getElementById('fp-pos-x');
    const yEl = document.getElementById('fp-pos-y');
    if (xEl) xEl.textContent = h.x + '%';
    if (yEl) yEl.textContent = h.y + '%';
}

function generateHotspotsPatch() {
    // produce a JS snippet replacing the floorplans hotspot arrays
    const minimal = floorplans.map(fp => ({ name: fp.name, hotspots: fp.hotspots }));
    const json = JSON.stringify(minimal, null, 2);
    return `// Hotspots patch (replace floorplans hotspots in js/floorplan.js)\nconst floorplans_hotspots_patch = ${json};\n`;
}

function downloadHotspotsPatch() {
    const content = generateHotspotsPatch();
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floorplans-hotspots-patch.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    const image = document.getElementById('floorplan-image');
    const overlay = document.getElementById('floorplan-overlay');
    const toggle = document.getElementById('toggle-highlights');

    function safeRender() {
        renderFloorplanMarkers(currentFloor);
    }

    if (image) {
        // try load persisted hotspots
        loadHotspotsFromLocal();
        if (image.complete) {
            safeRender();
        } else {
            image.addEventListener('load', safeRender);
        }

        // ResizeObserver to keep markers in place on layout changes
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(safeRender);
            ro.observe(image);
            // also observe parent in case layout shifts
            const parent = image.parentElement;
            if (parent) ro.observe(parent);
        } else {
            window.addEventListener('resize', safeRender);
        }
    }

    if (toggle && overlay) {
        toggle.addEventListener('click', () => {
            const visible = overlay.style.display !== 'none';
            overlay.style.display = visible ? 'none' : '';
            toggle.setAttribute('aria-pressed', String(!visible));
        });
    }

    // Save / Export buttons
    const saveBtn = document.getElementById('save-hotspots');
    const exportBtn = document.getElementById('export-hotspots');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const ok = saveHotspotsToLocal();
            saveBtn.textContent = ok ? 'Gespeichert' : 'Fehler';
            setTimeout(() => saveBtn.textContent = 'Positionen speichern', 1200);
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportHotspots();
        });
    }

    // download patch button removed per request

    // close info panel when clicking outside
    document.addEventListener('click', (ev) => {
        const info = document.getElementById('fp-info');
        const overlayEl = document.getElementById('floorplan-overlay');
        if (!info || !overlayEl) return;

        const isClickInside = overlayEl.contains(ev.target) || info.contains(ev.target) || (toggle && toggle.contains(ev.target));
        if (!isClickInside) {
            info.style.display = 'none';
            info.setAttribute('aria-hidden', 'true');
        }
        
    });
});