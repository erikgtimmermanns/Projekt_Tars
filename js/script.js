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

    // Optional: GIF-Hintergrund pro Wetterklasse setzen.
    // Lege GIFs unter ./assets/gifs/ ab (z. B. sunny.gif, rain.gif, snow.gif, fog.gif, thunder.gif)
    const gifMap = {
        "weather-default": 'none',
        "weather-sunny":  'url("./assets/gifs/sunny.gif")',
        "weather-cloudy": 'none',
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

    // Ensure canvas animator exists and set its mode
    try {
        const animator = ensureWeatherAnimator();
        if (animator) animator.setMode(currentWeatherClass);
    } catch (e) {
        console.warn('Weather animator fehlt oder konnte nicht gesetzt werden', e);
    }
}


/* =========================================
   CANVAS WEATHER ANIMATOR
   Einfaches, performantes Teilchensystem
========================================= */

class WeatherAnimator {
    constructor(canvasId = 'weather-canvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.dpr = Math.max(1, window.devicePixelRatio || 1);
        this.particles = [];
        this.mode = 'weather-default';
        this.running = false;
        this._boundTick = this._tick.bind(this);

        this._onResize = this._onResize.bind(this);
        window.addEventListener('resize', this._onResize);
        this._onResize();
        this.start();
    }

    _onResize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = Math.max(1, Math.floor(rect.width));
        this.height = Math.max(1, Math.floor(rect.height));
        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        if (this.ctx) this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    start() {
        if (this.running) return;
        this.running = true;
        requestAnimationFrame(this._boundTick);
    }

    stop() {
        this.running = false;
    }

    setMode(mode) {
        if (!this.canvas) return;
        this.mode = mode || 'weather-default';
        this.particles.length = 0;

        const countBase = Math.round((this.width * this.height) / 6000);

        if (this.mode === 'weather-rain') {
            for (let i = 0; i < countBase * 3; i++) this._addRain();
        } else if (this.mode === 'weather-snow') {
            for (let i = 0; i < countBase * 1.5; i++) this._addSnow();
        } else if (this.mode === 'weather-fog') {
            for (let i = 0; i < Math.max(6, Math.round(this.width / 120)); i++) this._addFog();
        } else if (this.mode === 'weather-thunder') {
            for (let i = 0; i < countBase * 2; i++) this._addRain();
        } else if (this.mode === 'weather-sunny') {
            for (let i = 0; i < Math.max(8, Math.round(this.width / 80)); i++) this._addSpark();
        }
    }

    _addRain() {
        this.particles.push({
            type: 'rain',
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            len: 8 + Math.random() * 12,
            speed: 300 + Math.random() * 400,
            alpha: 0.35 + Math.random() * 0.5
        });
    }

    _addSnow() {
        this.particles.push({
            type: 'snow',
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            r: 1 + Math.random() * 3.5,
            speed: 20 + Math.random() * 40,
            drift: (Math.random() - 0.5) * 0.6,
            alpha: 0.6 + Math.random() * 0.4
        });
    }

    _addFog() {
        this.particles.push({
            type: 'fog',
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            w: 0.25 * this.width + Math.random() * 0.5 * this.width,
            alpha: 0.04 + Math.random() * 0.06,
            speed: 5 + Math.random() * 20
        });
    }

    _addSpark() {
        this.particles.push({
            type: 'spark',
            x: Math.random() * this.width,
            y: Math.random() * this.height * 0.6,
            r: 0.6 + Math.random() * 2.4,
            life: 1 + Math.random() * 2,
            vx: (Math.random() - 0.5) * 10,
            vy: -10 - Math.random() * 20,
            alpha: 0.6 + Math.random() * 0.4
        });
    }

    _tick(ts) {
        if (!this.running) return;
        if (!this._lastTs) this._lastTs = ts;
        const dt = Math.min(60, ts - this._lastTs) / 1000; // in seconds
        this._lastTs = ts;

        this._update(dt);
        this._draw();

        requestAnimationFrame(this._boundTick);
    }

    _update(dt) {
        const w = this.width;
        const h = this.height;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            if (p.type === 'rain') {
                p.y += p.speed * dt;
                p.x += 40 * dt; // light wind
                if (p.y > h + p.len) {
                    p.y = -10;
                    p.x = Math.random() * w;
                }
            } else if (p.type === 'snow') {
                p.y += p.speed * dt;
                p.x += p.drift * 20 * dt;
                if (p.y > h + 10) {
                    p.y = -10;
                    p.x = Math.random() * w;
                }
            } else if (p.type === 'fog') {
                p.x += p.speed * 0.1 * dt;
                if (p.x - p.w > w) p.x = -p.w;
            } else if (p.type === 'spark') {
                p.life -= dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.alpha = Math.max(0, p.life / 2);
                if (p.life <= 0 || p.y < -50) {
                    // recycle
                    p.x = Math.random() * w;
                    p.y = Math.random() * h * 0.6;
                    p.life = 1 + Math.random() * 2;
                }
            }
        }
    }

    _draw() {
        const ctx = this.ctx;
        if (!ctx) return;
        ctx.clearRect(0, 0, this.width, this.height);

        // subtle background dim for thunder flashes
        if (this.mode === 'weather-thunder' && Math.random() < 0.008) {
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.fillRect(0, 0, this.width, this.height);
        }

        for (const p of this.particles) {
            if (p.type === 'rain') {
                ctx.strokeStyle = `rgba(200,220,255,${p.alpha})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - 6, p.y - p.len);
                ctx.stroke();
            } else if (p.type === 'snow') {
                ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'fog') {
                const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y);
                grad.addColorStop(0, `rgba(255,255,255,0)`);
                grad.addColorStop(0.5, `rgba(255,255,255,${p.alpha})`);
                grad.addColorStop(1, `rgba(255,255,255,0)`);
                ctx.fillStyle = grad;
                ctx.fillRect(p.x, p.y - 20, p.w, 60);
            } else if (p.type === 'spark') {
                ctx.fillStyle = `rgba(255,250,200,${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// instantiate animator lazily when DOM is ready
let weatherAnimator = null;
function ensureWeatherAnimator() {
    if (!weatherAnimator) {
        weatherAnimator = new WeatherAnimator('weather-canvas');
    }
    return weatherAnimator;
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