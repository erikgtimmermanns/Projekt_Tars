"use strict";

/* Datum und Uhrzeit */

function updateDateTime() {
    const now = new Date();

    const dateElement =
        document.getElementById("date");

    const timeElement =
        document.getElementById("time");

    if (dateElement) {
        dateElement.textContent =
            new Intl.DateTimeFormat(
                "de-DE",
                {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            ).format(now);
    }

    if (timeElement) {
        timeElement.textContent =
            new Intl.DateTimeFormat(
                "de-DE",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ).format(now) + " Uhr";
    }
}

/* Wetterbeschreibung */

function getWeatherDescription(code) {
    const weatherCodes = {
        0: ["☀️", "Sonnig"],
        1: ["🌤️", "Leicht bewölkt"],
        2: ["⛅", "Teilweise bewölkt"],
        3: ["☁️", "Bewölkt"],

        45: ["🌫️", "Nebel"],
        48: ["🌫️", "Nebel"],

        51: ["🌦️", "Leichter Nieselregen"],
        53: ["🌦️", "Nieselregen"],
        55: ["🌧️", "Starker Nieselregen"],

        61: ["🌧️", "Leichter Regen"],
        63: ["🌧️", "Regen"],
        65: ["🌧️", "Starker Regen"],

        71: ["❄️", "Leichter Schneefall"],
        73: ["❄️", "Schneefall"],
        75: ["❄️", "Starker Schneefall"],

        80: ["🌦️", "Regenschauer"],
        81: ["🌧️", "Regenschauer"],
        82: ["🌧️", "Starke Regenschauer"],

        95: ["⛈️", "Gewitter"],
        96: ["⛈️", "Gewitter mit Hagel"],
        99: ["⛈️", "Starkes Gewitter"]
    };

    return weatherCodes[code] ||
        ["🌍", "Unbekannt"];
}

/* Wetterdaten laden */

async function loadWeather() {
    const iconElement =
        document.getElementById(
            "weather-icon"
        );

    const temperatureElement =
        document.getElementById(
            "temperature"
        );

    const descriptionElement =
        document.getElementById(
            "weather-description"
        );

    const humidityElement =
        document.getElementById(
            "humidity"
        );

    const windElement =
        document.getElementById(
            "wind"
        );

    try {
        const apiUrl =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=51.2277" +
            "&longitude=6.7735" +
            "&current=" +
            "temperature_2m," +
            "relative_humidity_2m," +
            "wind_speed_10m," +
            "weather_code" +
            "&timezone=Europe%2FBerlin";

        const response = await fetch(
            apiUrl,
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                "Wetteranfrage fehlgeschlagen: " +
                response.status
            );
        }

        const data =
            await response.json();

        const current =
            data.current;

        if (!current) {
            throw new Error(
                "Keine aktuellen Wetterdaten erhalten."
            );
        }

        const weather =
            getWeatherDescription(
                current.weather_code
            );

        const temperature =
            Math.round(
                Number(
                    current.temperature_2m
                ) * 10
            ) / 10;

        const wind =
            Math.round(
                Number(
                    current.wind_speed_10m
                ) * 10
            ) / 10;

        if (iconElement) {
            iconElement.textContent =
                weather[0];
        }

        if (temperatureElement) {
            temperatureElement.textContent =
                temperature + "°C";
        }

        if (descriptionElement) {
            descriptionElement.textContent =
                weather[1];
        }

        if (humidityElement) {
            humidityElement.textContent =
                "Luftfeuchte: " +
                current.relative_humidity_2m +
                "%";
        }

        if (windElement) {
            windElement.textContent =
                "Wind: " +
                wind +
                " km/h";
        }

    } catch (error) {
        console.error(
            "Wetterfehler:",
            error
        );

        if (iconElement) {
            iconElement.textContent = "⚠️";
        }

        if (temperatureElement) {
            temperatureElement.textContent =
                "--°C";
        }

        if (descriptionElement) {
            descriptionElement.textContent =
                "Wetterdaten nicht verfügbar";
        }

        if (humidityElement) {
            humidityElement.textContent =
                "Luftfeuchte: --";
        }

        if (windElement) {
            windElement.textContent =
                "Wind: --";
        }
    }
}

/* Dashboard starten */

function startDashboard() {
    updateDateTime();
    loadWeather();

    window.setInterval(
        updateDateTime,
        1000
    );

    window.setInterval(
        loadWeather,
        600000
    );
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        startDashboard
    );
} else {
    startDashboard();
}