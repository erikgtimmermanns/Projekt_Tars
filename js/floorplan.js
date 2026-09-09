const floorplans = [

    {
        name: "Erdgeschoss",
        image:
            "assets/floorplans/Raumplan_Erdgeschoss.png"
    },

    {
        name: "1. Obergeschoss",
        image:
            "assets/floorplans/Raumplan_1OG.png"
    },

    {
        name: "2. Obergeschoss",
        image:
            "assets/floorplans/Raumplan_2OG.png"
    },

    {
        name: "3. Obergeschoss",
        image:
            "assets/floorplans/Raumplan_3OG.png"
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

        image.src =
            floorplans[currentFloor]
                .image;

        title.textContent =
            floorplans[currentFloor]
                .name;

        image.style.opacity = 1;

    }, 500);
}

setInterval(
    rotateFloorplan,
    10000
);