import { updateDateTime } from "./datetime.js";
import { rotateWelcome } from "./welcome.js";
import { loadWeather } from "./weather.js";
import { loadVisitorProfile } from "./visitor.js";
import { rotateFloorplan } from "./floorplan.js";
//import { rotateFact } from "./facts.js";

document.addEventListener("DOMContentLoaded", async function () {
    console.log("HTML wurde vollständig geladen");

    await loadVisitorProfile();
    updateDateTime();
    rotateWelcome();
    rotateFloorplan();
//    rotateFact();
    loadWeather();

    setInterval(updateDateTime, 1000);
    setInterval(loadWeather, 600000);
    setInterval(loadVisitorProfile, 15000);
});