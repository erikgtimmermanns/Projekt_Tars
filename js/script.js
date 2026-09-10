"use strict";

console.log("script.js wurde erfolgreich geladen");


/* =========================================
   DATUM UND UHRZEIT
========================================= */

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


/* =========================================
   BESUCHERANZEIGE
========================================= */

function updateVisitorPanel() {
    const panel =
        document.getElementById(
            "visitor-panel"
        );

    const nameTarget =
        document.getElementById(
            "visitor-name-placeholder"
        );

    if (!panel || !nameTarget) {
        return;
    }

    const visitorName =
        String(
            window.visitorName || ""
        ).trim();

    if (visitorName.length > 0) {
        nameTarget.textContent =
            visitorName;

        panel.hidden = false;
    } else {
        nameTarget.textContent =
            "___";

        panel.hidden = true;
    }
}


/* =========================================
   WETTERBESCHREIBUNGEN
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

    return weatherCodes[code] || [
        "🌍",
        "Wetter unbekannt"
    ];
}


/* =========================================
   PASSENDE CSS-KLASSE BESTIMMEN
========================================= */

function getWeatherClass(code) {
    if (code === 0) {
        return "weather-sunny";
    }

    if (code >= 1 && code <= 3) {
        return "weather-cloudy";
    }

    if (code === 45 || code === 48) {
        return "weather-fog";
    }

    if (
        (code >= 51 && code <= 67) ||
        (code >= 80 && code <= 82)
    ) {
        return "weather-rain";
    }

    if (
        (code >= 71 && code <= 77) ||
        code === 85 ||
        code === 86
    ) {
        return "weather-snow";
    }

    if (code >= 95 && code <= 99) {
        return "weather-thunder";
    }

    return "weather-default";
}


/* =========================================
   ANIMATIONSKLASSE SETZEN
========================================= */

function updateWeatherAnimation(code) {
    const weatherCard =
        document.getElementById(
            "weather-card"
        );

    if (!weatherCard) {
        console.error(
            "Das Element #weather-card wurde nicht gefunden."
        );

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

    const currentWeatherClass =
        getWeatherClass(code);

    weatherCard.classList.add(
        currentWeatherClass
    );

    console.log(
        "Aktive Wetterklasse:",
        currentWeatherClass
    );
}


/* =========================================
   WETTERDATEN VON OPEN-METEO LADEN
========================================= */

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

        console.log(
            "Wetterdaten werden geladen ..."
        );

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

        const roundedHumidity =
            Math.round(
                Number(
                    current.relative_humidity_2m
                )
            );

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
                roundedHumidity +
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
            "Wetterdaten erfolgreich geladen:",
            {
                weatherCode:
                    weatherCode,

                weatherClass:
                    getWeatherClass(
                        weatherCode
                    ),

                description:
                    weather[1],

                temperature:
                    roundedTemperature,

                humidity:
                    roundedHumidity,

                wind:
                    roundedWind
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

        updateWeatherAnimation(-1);
    }
}


/* =========================================
   OPTIONALER TESTMODUS
========================================= */

/*
 * Diese Funktion kannst du in der
 * Browser-Konsole aufrufen.
 *
 * Beispiele:
 *
 * testWeather(0);  Sonne
 * testWeather(3);  Wolken
 * testWeather(45); Nebel
 * testWeather(61); Regen
 * testWeather(71); Schnee
 * testWeather(95); Gewitter
 */

function testWeather(code) {
    const weatherIcon =
        document.getElementById(
            "weather-icon"
        );

    const weatherDescription =
        document.getElementById(
            "weather-description"
        );

    const weather =
        getWeatherDescription(
            Number(code)
        );

    if (weatherIcon) {
        weatherIcon.textContent =
            weather[0];
    }

    if (weatherDescription) {
        weatherDescription.textContent =
            weather[1] +
            " · Testmodus";
    }

    updateWeatherAnimation(
        Number(code)
    );

    console.log(
        "Wetter-Test gestartet:",
        {
            code: Number(code),
            class:
                getWeatherClass(
                    Number(code)
                ),
            description:
                weather[1]
        }
    );
}


/* Für Tests über die Browser-Konsole */

window.testWeather =
    testWeather;

window.loadWeather =
    loadWeather;


/* =========================================
   DASHBOARD STARTEN
========================================= */

function startDashboard() {
    console.log(
        "Dashboard wird gestartet"
    );

    updateDateTime();
    updateVisitorPanel();
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