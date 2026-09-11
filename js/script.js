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

    // Set overlay color per weather class to visually represent cloudiness/dimness
    const overlayMap = {
        'weather-default': 'transparent',
        'weather-sunny': 'rgba(255,255,240,0.02)',
        // For cloudy we want white clouds moving in the background, not a dark overlay
        'weather-cloudy': 'transparent',
        'weather-rain': 'rgba(30,40,50,0.12)',
        'weather-snow': 'rgba(240,245,250,0.04)',
        'weather-fog': 'rgba(255,255,255,0.06)',
        'weather-thunder': 'rgba(20,24,30,0.22)'
    };

    const overlay = overlayMap[currentWeatherClass] || 'transparent';
    try { weatherCard.style.setProperty('--weather-overlay', overlay); } catch (e) { /* ignore */ }

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

    // Explicitly show/hide the HTML layers to avoid leftover visuals
    try {
        const rainEl = animRoot.querySelector('.rain-layer');
        const snowEl = animRoot.querySelector('.snow-layer');
        const fogEl = animRoot.querySelector('.fog-layer');
        const lightningEl = animRoot.querySelector('.lightning');
        const cloudEls = animRoot.querySelectorAll('.weather-cloud, .cloud-two');

        if (rainEl) {
            if (currentWeatherClass === 'weather-rain') { rainEl.style.display = ''; rainEl.style.opacity = '0.9'; }
            else { rainEl.style.opacity = '0'; rainEl.style.display = 'none'; }
        }
        if (snowEl) {
            if (currentWeatherClass === 'weather-snow') { snowEl.style.display = ''; snowEl.style.opacity = '0.9'; }
            else { snowEl.style.opacity = '0'; snowEl.style.display = 'none'; }
        }
        if (fogEl) {
            if (currentWeatherClass === 'weather-fog') { fogEl.style.display = ''; fogEl.style.opacity = '0.85'; }
            else { fogEl.style.opacity = '0'; fogEl.style.display = 'none'; }
        }
        if (lightningEl) {
            if (currentWeatherClass === 'weather-thunder') { lightningEl.style.display = ''; lightningEl.style.opacity = '1'; }
            else { lightningEl.style.opacity = '0'; lightningEl.style.display = 'none'; }
        }

        // clouds: for cloudy and sunny we allow cloud DOM elements, otherwise hide
        const showCloud = (currentWeatherClass === 'weather-cloudy' || currentWeatherClass === 'weather-sunny');
        cloudEls.forEach(c => c.style.opacity = showCloud ? '' : '0');
    } catch (e) {
        // ignore if animRoot missing
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
        this.targetMode = 'weather-default';
        this.targetCounts = { rain: 0, snow: 0, fog: 0, spark: 0, cloud: 0 };
        this.wind = 0; // positive -> wind to the right
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
        this.targetMode = mode || 'weather-default';

        // determine wind and target particle counts based on mode
        const base = Math.max(1, Math.round((this.width * this.height) / 6000));
        const w = this.width;

        // reset target counts
        this.targetCounts = { rain: 0, snow: 0, fog: 0, spark: 0, cloud: 0 };

        switch (this.targetMode) {
            case 'weather-rain':
                this.wind = 40;
                this.targetCounts.rain = base * 3;
                this.targetCounts.cloud = Math.max(6, Math.round(w / 180));
                break;
            case 'weather-snow':
                this.wind = 8;
                this.targetCounts.snow = Math.round(base * 1.6);
                this.targetCounts.cloud = Math.max(4, Math.round(w / 220));
                break;
            case 'weather-fog':
                this.wind = 6;
                this.targetCounts.fog = Math.max(6, Math.round(w / 120));
                this.targetCounts.cloud = Math.max(3, Math.round(w / 300));
                break;
            case 'weather-thunder':
                this.wind = 60;
                this.targetCounts.rain = base * 2.5;
                this.targetCounts.cloud = Math.max(8, Math.round(w / 140));
                break;
            case 'weather-sunny':
                this.wind = 6;
                this.targetCounts.spark = Math.max(8, Math.round(w / 80));
                this.targetCounts.cloud = Math.max(2, Math.round(w / 320));
                break;
            case 'weather-cloudy':
                // heavy overcast: many large soft clouds and a subtle dim overlay
                this.wind = 12;
                // fewer, larger, softer white clouds for background motion
                this.targetCounts.cloud = Math.max(4, Math.round(w / 220));
                this.targetCounts.fog = Math.max(0, Math.round(w / 1200));
                break;
            default:
                this.wind = 6;
                this.targetCounts.cloud = Math.max(2, Math.round(w / 400));
        }

        // do not immediately clear particles; we'll smoothly spawn/decay
        // If switching to a non-precipitating mode like cloudy, remove rain particles immediately
        if (this.targetMode === 'weather-cloudy' || this.targetMode === 'weather-default' || this.targetMode === 'weather-sunny') {
            this.particles = this.particles.filter(p => p.type !== 'rain');
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

        // spawn towards targets gradually
        const totals = { rain: 0, snow: 0, fog: 0, spark: 0, cloud: 0 };
        for (const p of this.particles) totals[p.type] = (totals[p.type] || 0) + 1;

        // spawn a few particles per tick to smooth transitions
        const spawnBudget = Math.max(1, Math.round(60 * dt));
        for (let s = 0; s < spawnBudget; s++) {
            if (totals.rain < this.targetCounts.rain) { this._addRain(); totals.rain++; continue; }
            if (totals.snow < this.targetCounts.snow) { this._addSnow(); totals.snow++; continue; }
            if (totals.fog < this.targetCounts.fog) { this._addFog(); totals.fog++; continue; }
            if (totals.spark < this.targetCounts.spark) { this._addSpark(); totals.spark++; continue; }
            if (totals.cloud < this.targetCounts.cloud) { this._addCloud(); totals.cloud++; continue; }
            break;
        }

        // update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            if (p.type === 'rain') {
                p.y += p.speed * dt;
                p.x += this.wind * dt * (0.6 + Math.random() * 0.8);
                if (p.y > h + p.len) {
                    // recycle to top
                    p.y = -10 - Math.random() * 40;
                    p.x = Math.random() * w;
                }
            } else if (p.type === 'snow') {
                p.y += p.speed * dt;
                p.x += p.drift * 20 * dt + this.wind * 0.02 * dt;
                if (p.y > h + 10) {
                    p.y = -10 - Math.random() * 20;
                    p.x = Math.random() * w;
                }
            } else if (p.type === 'fog') {
                p.x += p.speed * 0.05 * dt + this.wind * 0.02 * dt;
                if (p.x - p.w > w) p.x = -p.w;
            } else if (p.type === 'spark') {
                p.life -= dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.alpha = Math.max(0, p.life / 2);
                if (p.life <= 0 || p.y < -50) {
                    p.x = Math.random() * w;
                    p.y = Math.random() * h * 0.6;
                    p.life = 1 + Math.random() * 2;
                }
            } else if (p.type === 'cloud') {
                p.x += p.speed * dt * (0.2 + (this.wind / 200));
                if (p.x - p.w > w) p.x = -p.w;
            }

            // fade out particle types that are not wanted in the current target mode
            const desired = (this.targetCounts[p.type] || 0) > 0;
            if (!desired) {
                // ensure an alpha property exists
                if (typeof p.alpha !== 'number') p.alpha = 1;
                p.alpha -= dt * 1.4; // fade speed (seconds)
                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }
            }

            // decay particles that are not needed to keep total count bounded
            if (this.particles.length > Math.max(200, Math.round((w * h) / 3500))) {
                this.particles.splice(i, 1);
            }
        }
    }

    _draw() {
        const ctx = this.ctx;
        if (!ctx) return;
        ctx.clearRect(0, 0, this.width, this.height);
        // thunder flash (occasional)
        if (this.targetMode === 'weather-thunder' && Math.random() < 0.01) {
            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            ctx.fillRect(0, 0, this.width, this.height);
            // draw a simple bolt
            ctx.strokeStyle = 'rgba(255,255,230,0.95)';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            const sx = Math.random() * this.width * 0.8 + this.width * 0.1;
            let sy = Math.random() * this.height * 0.4 + 10;
            ctx.moveTo(sx, sy);
            for (let i = 0; i < 8; i++) {
                sx += (Math.random() - 0.5) * 60;
                sy += 20 + Math.random() * 40;
                ctx.lineTo(sx, sy);
            }
            ctx.stroke();
        }

        for (const p of this.particles) {
            if (p.type === 'rain') {
                ctx.strokeStyle = `rgba(180,200,230,${p.alpha})`;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - (this.wind * 0.06), p.y - p.len);
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
            } else if (p.type === 'cloud') {
                // soft cloud using multiple circles; apply gentle blur per layer
                ctx.save();
                const blurPx = Math.max(0, p.layer * 3);
                ctx.filter = `blur(${blurPx}px)`;

                // For cloudy mode show white/soft clouds in background
                let baseColor;
                if (this.targetMode === 'weather-cloudy') {
                    baseColor = `rgba(255,255,255,${Math.min(0.95, 0.6 * p.alpha + 0.25)})`;
                } else if (this.targetMode === 'weather-rain' || this.targetMode === 'weather-thunder') {
                    const a = Math.min(0.9, 0.18 + p.alpha * 0.6);
                    baseColor = `rgba(70,80,95,${a})`;
                } else {
                    baseColor = `rgba(255,255,255,${p.alpha})`;
                }

                ctx.fillStyle = baseColor;
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, p.w * 0.6, p.h * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(p.x + p.w * 0.35, p.y - p.h * 0.15, p.w * 0.45, p.h * 0.45, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }

    _addCloud() {
        // create softer, layered clouds by varying size, alpha and blur layer
        const layer = 1 + Math.floor(Math.random() * 3);
        this.particles.push({
            type: 'cloud',
            x: Math.random() * this.width,
            y: 20 + Math.random() * (this.height * 0.5),
            w: 120 + Math.random() * 480,
            h: 40 + Math.random() * 140,
            alpha: 0.10 + Math.random() * 0.28,
            speed: 4 + Math.random() * 18,
            layer: layer
        });
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

        // Icon dynamics: mark icons and set CSS variables for animations
        try {
            const humidityIcon = document.querySelector('#humidity')?.closest('.weather-detail')?.querySelector('.weather-detail-icon');
            const windIcon = document.querySelector('#wind')?.closest('.weather-detail')?.querySelector('.weather-detail-icon');

            if (humidityIcon) {
                humidityIcon.classList.add('icon-humidity');
                // set --hum in range 0..1
                const humVal = Math.max(0, Math.min(100, roundedHumidity)) / 100;
                humidityIcon.style.setProperty('--hum', String(humVal));
            }

            if (windIcon) {
                windIcon.classList.add('icon-wind');
                // set --wind amplitude (clamp): small value around 1..8
                const windAmp = Math.min(12, Math.max(0, roundedWind / 3));
                windIcon.style.setProperty('--wind', String(windAmp));
            }
        } catch (e) {
            // ignore if structure differs
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

    // ensure canvas animator exists early
    try { ensureWeatherAnimator(); } catch (e) { /* ignore */ }

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