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

    fp.hotspots.forEach(h => {
        const marker = document.createElement('button');
        marker.className = 'fp-marker';
        marker.type = 'button';
        marker.setAttribute('aria-label', h.label);

        // position in pixels relative to overlay
        const px = (h.x / 100) * imgRect.width;
        const py = (h.y / 100) * imgRect.height;

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

            // show info panel
            const info = document.getElementById('fp-info');
            if (info) {
                info.innerHTML = `\n+                    <h4>${h.label}</h4>\n+                    <p>Typ: ${h.type}</p>\n+                    <p>ID: ${h.id}</p>\n+                `;
                info.style.display = 'block';
                info.setAttribute('aria-hidden','false');
            }
        });

        overlay.appendChild(marker);
    });
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