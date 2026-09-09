"use strict";

console.log("script.js wurde erfolgreich geladen");

function updateDateTime() {
    const now = new Date();
    const dateElement = document.getElementById("date");
    const timeElement = document.getElementById("time");

    const formattedDate = new Intl.DateTimeFormat("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(now);

    const formattedTime = new Intl.DateTimeFormat("de-DE", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(now);

    if (dateElement) {
        dateElement.textContent = formattedDate;
    }

    if (timeElement) {
        timeElement.textContent = formattedTime + " Uhr";
    }
}

function updateVisitorPanel() {
    const panel = document.getElementById("visitor-panel");
    const nameTarget = document.getElementById("visitor-name-placeholder");
    const nameValue = (window.visitorName || "Max Mustermann").trim();

    if (!panel || !nameTarget) {
        return;
    }

    if (nameValue.length > 0) {
        nameTarget.textContent = nameValue;
        panel.hidden = false;
    } else {
        nameTarget.textContent = "___";
        panel.hidden = true;
    }
}

/* =========================================
   WETTERDARSTELLUNG
========================================= */

function getWeatherDescription(code) {
    const weatherCodes = {
        0: ["☀️", "Sonnig"],

        1: ["🌤️", "Leicht bewölkt"],
        2: ["⛅", "Teilweise bewölkt"],
        3: ["☁️", "Bewölkt"],

        45: ["🌫️", "Nebel"],
        48: ["🌫️", "Gefrierender Nebel"],

        51: ["🌦️", "Leichter Nieselregen"],
        53: ["🌦️", "Nieselregen"],
        55: ["🌧️", "Starker Nieselregen"],

        56: ["🌧️", "Gefrierender Nieselregen"],
        57: ["🌧️", "Starker gefrierender Nieselregen"],

        61: ["🌧️", "Leichter Regen"],
        63: ["🌧️", "Regen"],
        65: ["🌧️", "Starker Regen"],

        66: ["🌧️", "Gefrierender Regen"],
        67: ["🌧️", "Starker gefrierender Regen"],

        71: ["❄️", "Leichter Schneefall"],
        73: ["❄️", "Schneefall"],
        75: ["❄️", "Starker Schneefall"],
        77: ["❄️", "Schneegriesel"],

        80: ["🌦️", "Leichte Regenschauer"],
        81: ["🌧️", "Regenschauer"],
        82: ["🌧️", "Starke Regenschauer"],

        85: ["🌨️", "Leichte Schneeschauer"],
        86: ["🌨️", "Starke Schneeschauer"],

        95: ["⛈️", "Gewitter"],
        96: ["⛈️", "Gewitter mit Hagel"],
        99: ["⛈️", "Starkes Gewitter mit Hagel"]
    };

    return weatherCodes[code] ||
        ["🌍", "Wetter unbekannt"];
}


/* Wetterklasse anhand des Wettercodes */

function getWeatherClass(code) {
    if (code === 0) {
        return "weather-sunny";
    }

    if (
        code >= 1 &&
        code <= 3
    ) {
        return "weather-cloudy";
    }

    if (
        code === 45 ||
        code === 48
    ) {
        return "weather-fog";
    }

    if (
        code >= 51 &&
        code <= 67
    ) {
        return "weather-rain";
    }

    if (
        code >= 71 &&
        code <= 77
    ) {
        return "weather-snow";
    }

    if (
        code >= 80 &&
        code <= 82
    ) {
        return "weather-rain";
    }

    if (
        code === 85 ||
        code === 86
    ) {
        return "weather-snow";
    }

    if (code >= 95) {
        return "weather-thunder";
    }

    return "weather-default";
}


/* Wetterklasse aktualisieren */

function updateWeatherAnimation(code) {
    const weatherCard =
        document.getElementById(
            "weather-card"
        );

    if (!weatherCard) {
        return;
    }

    const weatherClasses = [
        "weather-default",
        "weather-sunny",
        "weather-cloudy",
        "weather-rain",
        "weather-snow",
        "weather-fog",
        "weather-thunder"
    ];

    weatherCard.classList.remove(
        ...weatherClasses
    );

    weatherCard.classList.add(
        getWeatherClass(code)
    );
}


/* Wetterdaten abrufen */

async function loadWeather() {
    const weatherIcon =
        document.getElementById(
            "weather-icon"
        );

    const temperature =
        document.getElementById(
            "temperature"
        );

    const weatherDescription =
        document.getElementById(
            "weather-description"
        );

    const humidity =
        document.getElementById(
            "humidity"
        );

    const wind =
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

        const response =
            await fetch(
                apiUrl,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                "HTTP-Fehler: " +
                response.status
            );
        }

        const data =
            await response.json();

        if (!data.current) {
            throw new Error(
                "Keine aktuellen Wetterdaten erhalten."
            );
        }

        const current =
            data.current;

        const weatherCode =
            Number(
                current.weather_code
            );

        const weather =
            getWeatherDescription(
                weatherCode
            );

        const roundedTemperature =
            Math.round(
                Number(
                    current.temperature_2m
                ) * 10
            ) / 10;

        const roundedWind =
            Math.round(
                Number(
                    current.wind_speed_10m
                ) * 10
            ) / 10;

        if (weatherIcon) {
            weatherIcon.textContent =
                weather[0];
        }

        if (temperature) {
            temperature.textContent =
                roundedTemperature +
                "°C";
        }

        if (weatherDescription) {
            weatherDescription.textContent =
                weather[1];
        }

        if (humidity) {
            humidity.textContent =
                current.relative_humidity_2m +
                "%";
        }

        if (wind) {
            wind.textContent =
                roundedWind +
                " km/h";
        }

        updateWeatherAnimation(
            weatherCode
        );

        console.log(
            "Wetterdaten geladen:",
            {
                code: weatherCode,
                description: weather[1],
                temperature:
                    roundedTemperature,
                humidity:
                    current
                        .relative_humidity_2m,
                wind: roundedWind
            }
        );

    } catch (error) {
        console.error(
            "Fehler beim Laden der Wetterdaten:",
            error
        );

        if (weatherIcon) {
            weatherIcon.textContent =
                "⚠️";
        }

        if (temperature) {
            temperature.textContent =
                "--°C";
        }

        if (weatherDescription) {
            weatherDescription.textContent =
                "Wetterdaten nicht verfügbar";
        }

        if (humidity) {
            humidity.textContent =
                "--%";
        }

        if (wind) {
            wind.textContent =
                "-- km/h";
        }

        const weatherCard =
            document.getElementById(
                "weather-card"
            );

        if (weatherCard) {
            weatherCard.className =
                "weather weather-default";
        }
    }
}

async function loadWeather() {
    const weatherIcon = document.getElementById("weather-icon");
    const temperature = document.getElementById("temperature");
    const weatherDescription = document.getElementById("weather-description");
    const humidity = document.getElementById("humidity");
    const wind = document.getElementById("wind");

    try {
        const apiUrl = "https://api.open-meteo.com/v1/forecast" +
            "?latitude=51.2277" +
            "&longitude=6.7735" +
            "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
            "&timezone=Europe%2FBerlin";

        const response = await fetch(apiUrl, { cache: "no-store" });

        if (!response.ok) {
            throw new Error("HTTP-Fehler: " + response.status);
        }

        const data = await response.json();

        if (!data.current) {
            throw new Error("Keine aktuellen Wetterdaten erhalten");
        }

        const current = data.current;
        const weather = getWeatherDescription(current.weather_code);
        const roundedTemperature = Math.round(current.temperature_2m * 10) / 10;
        const roundedWind = Math.round(current.wind_speed_10m * 10) / 10;

        if (weatherIcon) {
            weatherIcon.textContent = weather[0];
        }

        if (temperature) {
            temperature.textContent = roundedTemperature + "°C";
        }

        if (weatherDescription) {
            weatherDescription.textContent = weather[1];
        }

        if (humidity) {
            humidity.textContent = "Luftfeuchte: " + current.relative_humidity_2m + "%";
        }

        if (wind) {
            wind.textContent = "Wind: " + roundedWind + " km/h";
        }

        console.log("Wetterdaten erfolgreich geladen");
    } catch (error) {
        console.error("Fehler beim Laden der Wetterdaten:", error);

        if (weatherIcon) {
            weatherIcon.textContent = "⚠️";
        }

        if (temperature) {
            temperature.textContent = "--°C";
        }

        if (weatherDescription) {
            weatherDescription.textContent = "Wetterdaten nicht verfügbar";
        }

        if (humidity) {
            humidity.textContent = "Luftfeuchte: --";
        }

        if (wind) {
            wind.textContent = "Wind: --";
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("HTML wurde vollständig geladen");

    updateDateTime();
    updateVisitorPanel();
    loadWeather();

    setInterval(updateDateTime, 1000);
    setInterval(loadWeather, 600000);
});