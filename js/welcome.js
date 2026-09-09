console.log("welcome.js wurde geladen");

/* =========================
   WECHSELNDE HEADER-TEXTE
========================= */

const welcomeMessages = [

    {
        eyebrow: "HERZLICH WILLKOMMEN",
        headline: "In unserer Geschäftsstelle <span>Düsseldorf</span>"
    },

    {
        eyebrow: "WELCOME",
        headline: "At our office in <span>Düsseldorf</span>"
    },

    {
        eyebrow: "BIENVENUE",
        headline: "Dans notre agence de <span>Düsseldorf</span>"
    },

    {
        eyebrow: "BENVENUTI",
        headline: "Nella nostra sede di <span>Düsseldorf</span>"
    },

    {
        eyebrow: "WITAMY",
        headline: "W naszym biurze w <span>Düsseldorf</span>"
    },

    {
        eyebrow: "ДОБРО ПОЖАЛОВАТЬ",
        headline: "В нашем офисе в <span>Дюссельдорфе</span>"
    }

];

let welcomeIndex = 0;

function rotateWelcome() {

    const eyebrow =
        document.getElementById(
            "eyebrow-text"
        );

    const headline =
        document.getElementById(
            "headline-text"
        );

    if (
        !eyebrow ||
        !headline
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

    headline.innerHTML =
        current.headline;

    welcomeIndex++;

    if (
        welcomeIndex >=
        welcomeMessages.length
    ) {
        welcomeIndex = 0;
    }
}

/* Sofort starten */

rotateWelcome();

/* Alle 5 Sekunden wechseln */

setInterval(
    rotateWelcome,
    5000
);