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


        image.src = floorplans[currentFloor].image;
        title.textContent = floorplans[currentFloor].name;

        // Render markers für neue Etage
        renderFloorplanMarkers(currentFloor);

        image.style.opacity = 1;

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
        elevator: '🛗',
        exit: '🚪',
        info: 'ℹ️',
        restroom: '🚻',
        stairs: '⬆️',
        meeting: '📁',
        important: '⚠️'
    };

    return map[type] || '📍';
}

function renderFloorplanMarkers(floorIndex) {
    const overlay = document.getElementById('floorplan-overlay');

    if (!overlay) return;

    overlay.innerHTML = '';

    const fp = floorplans[floorIndex];

    if (!fp || !fp.hotspots) return;

    fp.hotspots.forEach(h => {
        const marker = document.createElement('button');
        marker.className = 'fp-marker';
        marker.type = 'button';
        marker.setAttribute('aria-label', h.label);
        marker.style.left = h.x + '%';
        marker.style.top = h.y + '%';

        // set background color for exits / important
        if (h.type === 'exit') {
            marker.style.background = 'linear-gradient(180deg,#ff6b6b,#ff3b3b)';
        } else if (h.type === 'important' || h.type === 'server') {
            marker.style.background = 'linear-gradient(180deg,#ffb84d,#ff9a1f)';
        }

        const icon = document.createElement('span');
        icon.className = 'fp-icon';
        icon.textContent = iconForType(h.type);

        const label = document.createElement('span');
        label.className = 'fp-label';
        label.textContent = h.label;

        marker.appendChild(icon);
        marker.appendChild(label);

        marker.addEventListener('click', () => {
            // einfache Interaktion: kurze Info im Konsolen-Log und visuelles Feedback
            console.log('Hotspot angeklickt:', h);
            marker.animate([
                { transform: 'translate(-50%,-50%) scale(1.08)' },
                { transform: 'translate(-50%,-50%) scale(1)' }
            ], { duration: 300 });
        });

        overlay.appendChild(marker);
    });
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    renderFloorplanMarkers(currentFloor);

    const toggle = document.getElementById('toggle-highlights');
    const overlay = document.getElementById('floorplan-overlay');

    if (toggle && overlay) {
        toggle.addEventListener('click', () => {
            const visible = overlay.style.display !== 'none';
            overlay.style.display = visible ? 'none' : '';
            toggle.setAttribute('aria-pressed', String(!visible));
            toggle.textContent = visible ? 'Highlights' : 'Highlights';
        });
    }
});