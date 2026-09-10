"use strict";

console.log(
    "script.js wurde erfolgreich geladen"
);


/* =========================================
   DATUM UND UHRZEIT
========================================= */

function updateDateTime() {*    const now =
        new Date()*

    const dateElement =
        *ocument.getElementById(
          * "date"
        );

    const time*lement =
        document.getEleme*tById(
            "time"
        *;

    if (dateElement) {
        *ateElement.textContent =
         *  new Intl.DateTimeFormat(
       *        "de-DE",
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
            ).format(now) +
            " Uhr";
    }
}


/* =========================================
   BESUCHERANZEIGE
========================================= */

function updateVisitorPanel() {*    const panel =
        document*getElementById(
            "visit*r-panel"
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

function getWeatherDescript*on(code) {
    const weatherCodes * {
        0: ["☀️", "Sonnig"],

 *      1: ["🌤️", "Leicht bewölkt"]*
        2: ["⛅", "Teilweise bewölkt"],
        3: ["☁️", "Bewölkt"],*
        45: ["🌫️", "Nebel"],
   *    48: ["🌫️", "Gefrierender Nebel"],

        51: ["🌦️", "Leichter Nieselregen"],
        53: ["🌦️", "Nieselregen"],
        55: ["🌧️", "Starker Nieselregen"],

        *6: [
            "🌧️",
            "Gefrierender Nieselregen"
        ],

        57: [
            "🌧️",
            "Starker gefrierender Nieselregen"
        ],

       *61: ["🌧️", "Leichter Regen"],
   *    63: ["🌧️", "Regen"],
        *5: ["🌧️", "Starker Regen"],

    *   66: [
            "🌧️",
            "Gefrierender Regen"
        ],

        67: [
            "🌧️",
            "Starker gefrierender Regen"
        ],

        71: ["❄️", "Leichter Schneefall"],
       *73: ["❄️", "Schneefall"],
        *5: ["❄️", "Starker Schneefall"],
 *      77: ["❄️", "Schneegriesel"],

        80: ["🌦️", "Leichte Regenschauer"],
        81: ["🌧️", "Regenschauer"],
        82: ["🌧️", "Starke Regenschauer"],

        85: ["🌨️", "Leichte Schneeschauer"],
        86: ["🌨️", "Starke Schneeschauer"],

        95: ["⛈️", "Gewitter"],
        96: ["⛈️", "Gewitter mit Hagel"],

        99: [
            "⛈️",
            "Starkes Gewitter mit Hagel"
        ]
    };

    return weatherCodes[code] || [
        "🌍",
        "Wetter unbekannt"
    ];
}


/* =========================================
   PASSENDE WETTERKLASSE
========================================= */

function getWeatherClass(c*de) {
    if (code === 0) {
      * return "weather-sunny";
    }

  * if (code >= 1 && code <= 3) {
   *    return "weather-cloudy";
    }*
    if (
        code === 45 ||
 *      code === 48
    ) {
        *eturn "weather-fog";
    }

    if (
        (
            code >= 51 &&
            code <= 67
        ) ||
        (
            code >= 80 &&
            code <= 82
        )
    ) {
        return "weather-rain";
    }

    if (
        (
            code >= 71 &&
            code <= 77
        ) ||
        code === 85 ||
        code === 86
    ) {
        return "weather-snow";
    }

    if (
        code >= 95 &&
        code <= 99
    ) {
        return "weather-thunder";
    }

    return "weather-default";
}


/* =========================================
   WETTERANIMATION AKTUALISIEREN
========================================= */

function updateWeatherA*imation(code) {
    const weatherC*rd =
        document.getElementBy*d(
            "weather-card"
    *   );

    if (!weatherCard) {
   *    console.error(
            "#w*ather-card wurde nicht gefunden."
*       );

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

    const newClass =
        getWeatherClass(
            Number(code)
        );

    weatherCard.classList.add(
        newClass
    );

    console.log(
        "Aktive Wetterklasse:",
        newClass
    );
}


/* =========================================
   WETTERDATEN LADEN
========================================= */

async function loadWeather() {*    const weatherIcon =
        do*ument.getElementById(
            *weather-icon"
        );

    cons* temperature =
        document.ge*ElementById(
            "temperat*re"
        );

    const weatherD*scription =
        document.getEl*mentById(
            "weather-des*ription"
        );

    const hum*dity =
        document.getElement*yId(
            "humidity"
      * );

    const wind =
        docu*ent.getElementById(
            "w*nd"
        );

    try {
        *onst apiUrl =
            "https://api.open-meteo.com/v1/forecast" +
*           "?latitude=51.2277" +
 *          "&longitude=6.7735" +
  *         "&current=" +
           *"temperature_2m," +
            "r*lative_humidity_2m," +
           *"wind_speed_10m," +
            "w*ather_code" +
            "&timezo*e=Europe%2FBerlin";

        const*response =
            await fetch*
                apiUrl,
         *      {
                    cache:*                        "no-store"*                }
            );

*       if (!response.ok) {
       *    throw new Error(
             *  "HTTP-Fehler: " +
              * response.status
            );
  *     }

        const data =
     *      await response.json();

    *   if (!data.current) {
          * throw new Error(
                *Keine aktuellen Wetterdaten vorhan*en."
            );
        }

   *    const current =
            da*a.current;

        const weatherC*de =
            Number(
         *      current.weather_code
       *    );

        const weather =
  *         getWeatherDescription(
  *             weatherCode
         *  );

        const roundedTempera*ure =
            Math.round(
    *           Number(
               *    current.temperature_2m
       *        ) * 10
            ) / 10;*
        const roundedHumidity =
 *          Math.round(
            *   Number(
                    cur*ent
                        .relat*ve_humidity_2m
                )
 *          );

        const rounde*Wind =
            Math.round(
   *            Number(
              *     current.wind_speed_10m
      *         ) * 10
            ) / 10*

        if (weatherIcon) {
     *      weatherIcon.textContent =
  *             weather[0];
        }*
        if (temperature) {
      *     temperature.textContent =
   *            roundedTemperature +
 *              "°C";
        }

   *    if (weatherDescription) {
    *       weatherDescription.textCont*nt =
                weather[1];
 *      }

        if (humidity) {
 *          humidity.textContent =
 *              roundedHumidity +
  *             "%";
        }

     *  if (wind) {
            wind.tex*Content =
                roundedW*nd +
                " km/h";
    *   }

        updateWeatherAnimati*n(
            weatherCode
       *);

        console.log(
         *  "Wetterdaten geladen:",
        *   {
                code:
       *            weatherCode,

        *       description:
              *     weather[1],

                *eatherClass:
                    g*tWeatherClass(
                   *    weatherCode
                  * ),

                temperature:
*                   roundedTemperat*re,

                humidity:
   *                roundedHumidity,

*               wind:
             *      roundedWind
            }
  *     );

    } catch (error) {
   *    console.error(
            "Fe*ler beim Laden der Wetterdaten:",
*           error
        );

     *  if (weatherIcon) {
            w*atherIcon.textContent =
          *     "⚠️";
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

        updateWeatherAnimation(
            -1
        );
    }
}


/* =========================================
   WETTER-TESTFUNKTION
========================================= */

function testWeather(code) {*    const numericCode =
        Nu*ber(code);

    const weather =
  *     getWeatherDescription(
      *     numericCode
        );

    c*nst weatherIcon =
        document*getElementById(
            "weath*r-icon"
        );

    const weat*erDescription =
        document.g*tElementById(
            "weather*description"
        );

    if (w*atherIcon) {
        weatherIcon.t*xtContent =
            weather[0];
    }

    if (weatherDescription) {
        weatherDescription.textContent =
            weather[1] +
            " · Testmodus";
    }

    updateWeatherAnimation(
        numericCode
    );

    console.log(
        "Wetter-Test:",
        {
            code:
                numericCode,

            weatherClass:
                getWeatherClass(
                    numericCode
                ),

            description:
                weather[1]
        }
    );
}


/* Funktionen für die Browser-Konsole */

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

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        startDashboard
    );
} else {
    startDashboard();
}