import { OPEN_METEO } from "./config.js";

const dayFormat = new Intl.DateTimeFormat("en-CA", {
    timeZone: OPEN_METEO.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
});

// Heutiges Datum als YYYY-MM-DD in der Zeitzone des Standorts (nicht UTC, sonst stimmt es zwischen 0 und 2 Uhr nicht)
export function getTodayIso() {
    return dayFormat.format(new Date());
}
