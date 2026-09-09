console.log("welcome.js wurde geladen");

/* =========================
   HEADER-BEGRÜSSUNG
========================= */

const welcomeMessages = [

    {
        eyebrow: "HERZLICH WILLKOMMEN",
        location: "In unserer Geschäftsstelle",
        city: "Düsseldorf"
    },

    {
        eyebrow: "WELCOME",
        location: "At our office in",
        city: "Düsseldorf"
    },

    {
        eyebrow: "BIENVENUE",
        location: "Dans notre agence de",
        city: "Düsseldorf"
    },

    {
        eyebrow: "BENVENUTI",
        location: "Nella nostra sede di",
        city: "Düsseldorf"
    },

    {
        eyebrow: "WITAMY",
        location: "W naszym biurze w",
        city: "Düsseldorf"
    },

    {
        eyebrow: "ДОБРО ПОЖАЛОВАТЬ",
        location: "В нашем офисе в",
        city: "Дюссельдорфе"
    }

];

let welcomeIndex = 0;

function rotateWelcome() {

    const eyebrow =
        document.getElementById(
            "eyebrow-text"
        );

    const location =
        document.getElementById(
            "location-text"
        );

    const city =
        document.getElementById(
            "city-text"
        );

    if (
        !eyebrow ||
        !location ||
        !city
    ) {
        console.error(
            "Header-Elemente nicht gefunden"
        );

        return;
    }

    const current =
        welcomeMessages[
            welcomeIndex
        ];

    eyebrow.textContent =
        current.eyebrow;

    location.textContent =
        current.location;

    city.textContent =
        current.city;

    welcomeIndex++;

    if (
        welcomeIndex >=
        welcomeMessages.length
    ) {
        welcomeIndex = 0;
    }
}

/* Sofort anzeigen */

rotateWelcome();

/* Alle 5 Sekunden wechseln */

setInterval(
    rotateWelcome,
    5000
);