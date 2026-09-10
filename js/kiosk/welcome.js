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
export function rotateWelcome() {
    const welcomeText =
        document.getElementById(
            "eyebrow-text"
        );
    const welcomeHeadline =
        document.getElementById(
            "welcome-headline"
        );
    const welcomeSubtext =
        document.getElementById(
            "welcome-subtext"
        );
    if (!welcomeText || !welcomeHeadline) {
        console.error("Header-Elemente nicht gefunden");
        return;
    }
    welcomeText.style.opacity = 0;
    welcomeHeadline.style.opacity = 0;
    welcomeSubtext.style.opacity = 0;
    setTimeout(() => {
        welcomeIndex++;
        if (
            welcomeIndex >=
            welcomeMessages.length
        ) {
            welcomeIndex = 0;
        }
        const current =
            welcomeMessages[
                welcomeIndex
            ];
        // messages use `eyebrow` and `headline` keys; headline may contain HTML
        welcomeText.textContent = current.eyebrow || "";
        welcomeHeadline.innerHTML = current.headline || "";
        if (welcomeSubtext) welcomeSubtext.textContent = current.subtext || "";
        welcomeText.style.opacity = 1;
        welcomeHeadline.style.opacity = 1;
        welcomeSubtext.style.opacity = 1;
    }, 500);
}
/* Start */
setInterval(
    rotateWelcome,
    5000
);