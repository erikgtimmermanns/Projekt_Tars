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

    // Optional: GIF-Hintergrund pro Wetterklasse setzen.
    // Lege GIFs unter ./assets/gifs/ ab (z. B. sunny.gif, rain.gif, snow.gif, fog.gif, thunder.gif)
    const gifMap = {
        "weather-sunny":  'url("./assets/gifs/sunny.gif")',
        "weather-rain":   'url("./assets/gifs/rain.gif")',
        "weather-snow":   'url("./assets/gifs/snow.gif")',
        "weather-fog":    'url("./assets/gifs/fog.gif")',
        "weather-thunder":'url("./assets/gifs/thunder.gif")'
    };

    const gif = gifMap[currentWeatherClass] || 'none';

    try {
        weatherCard.style.setProperty('--weather-gif', gif);
    } catch (e) {
        // Defensive: falls style nicht verfügbar ist
        console.warn('Konnte --weather-gif nicht setzen', e);
    }

    // Aktivieren / Deaktivieren der HTML-Animate-Layer
    const animRoot = weatherCard.querySelector('.weather-animation');

    if (animRoot) {
        // entferne alle spezifischen data-state Attribute
        animRoot.querySelectorAll('.weather-sun, .weather-cloud, .cloud-two, .rain-layer, .snow-layer, .fog-layer, .lightning').forEach(el => {
            el.style.display = '';
        });

        // Sichtbarkeit wird durch CSS-Klassen auf #weather-card gesteuert; ensure layers exist
        // (Falls Elemente fehlen, nichts tun.)
    }

    console.log(
        "Aktive Wetterklasse:",
        currentWeatherClass
    );
}


/* =========================================
   WETTERDATEN VON OPEN-METEO LADEN
========================================= */

export async function loadWeather() {
    const weatherIcon = document.getElementById("weather-icon");
    const temperature = document.getElementById("temperature");
    const weatherDescription = document.getElementById("weather-description");
    const humidity = document.getElementById("humidity");
    const wind = document.getElementById("wind");

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