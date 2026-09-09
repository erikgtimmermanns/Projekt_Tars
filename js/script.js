"use strict";

console.log("script.js wurde erfolgreich geladen");

const kioskConfig = window.SUPABASE_CONFIG || {};
const kioskSupabaseUrl = kioskConfig.url || "";
const kioskSupabaseKey = kioskConfig.anonKey || "";
const kioskBucketName = kioskConfig.bucketName || "visitor-assets";
const kioskTableName = kioskConfig.tableName || "visitor_profiles";
const kioskSupabase = kioskSupabaseUrl && kioskSupabaseKey && !kioskSupabaseUrl.includes("YOUR-") && !kioskSupabaseKey.includes("YOUR-")
    ? window.supabase.createClient(kioskSupabaseUrl, kioskSupabaseKey)
    : null;

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
    const logoBox = document.querySelector(".visitor-logo");
    const imageUrl = window.visitorImageUrl || "";
    const nameValue = (window.visitorName || "").trim();

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

    if (logoBox) {
        if (imageUrl) {
            logoBox.style.backgroundImage = `url("${imageUrl}")`;
            logoBox.style.backgroundSize = "cover";
            logoBox.style.backgroundPosition = "center";
            logoBox.style.color = "transparent";
            logoBox.textContent = "";
        } else {
            logoBox.style.backgroundImage = "none";
            logoBox.style.color = "#0067b9";
            logoBox.textContent = "Logo";
        }
    }
}

async function loadVisitorProfile() {
    if (!kioskSupabase) {
        window.visitorName = "Max Mustermann";
        window.visitorImageUrl = "";
        updateVisitorPanel();
        return;
    }

    try {
        const { data, error } = await kioskSupabase
            .from(kioskTableName)
            .select("visitor_name, image_url")
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (data && data.visitor_name) {
            window.visitorName = data.visitor_name;
            window.visitorImageUrl = data.image_url || "";
        } else {
            window.visitorName = "";
            window.visitorImageUrl = "";
        }
    } catch (error) {
        console.warn("Visitor profile load failed:", error.message || error);
        window.visitorName = "";
        window.visitorImageUrl = "";
    }

    updateVisitorPanel();
}

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

    return weatherCodes[code] || ["🌍", "Unbekannt"];
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

document.addEventListener("DOMContentLoaded", async function () {
    console.log("HTML wurde vollständig geladen");

    updateDateTime();
    await loadVisitorProfile();
    loadWeather();

    setInterval(updateDateTime, 1000);
    setInterval(loadWeather, 600000);
    setInterval(loadVisitorProfile, 15000);
});