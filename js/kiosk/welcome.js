/* =========================
   WECHSELNDE BEGRÜSSUNG
========================= */
const welcomeMessages = [
    {
        title: "Willkommen",
        headline: "Schön, dass Sie bei uns sind.",
        text: "Wir wünschen Ihnen einen angenehmen Aufenthalt."
    },
    {
        title: "Welcome",
        headline: "Welcome to Computacenter Düsseldorf.",
        text: "We wish you a pleasant stay."
    },
    {
        title: "Bienvenue",
        headline: "Bienvenue chez Computacenter Düsseldorf.",
        text: "Nous vous souhaitons un agréable séjour."
    },
    {
        title: "Benvenuti",
        headline: "Benvenuti da Computacenter Düsseldorf.",
        text: "Vi auguriamo un piacevole soggiorno."
    },
    {
        title: "Witamy",
        headline: "Witamy w Computacenter Düsseldorf.",
        text: "Życzymy miłego pobytu."
    },
    {
        title: "Добро пожаловать",
        headline: "Добро пожаловать в Computacenter Düsseldorf.",
        text: "Желаем приятного пребывания."
    }
];
let welcomeIndex = 0;
export function rotateWelcome() {
    const welcomeText =
        document.getElementById(
            "welcome-text"
        );
    const welcomeHeadline =
        document.getElementById(
            "welcome-headline"
        );
    const welcomeSubtext =
        document.getElementById(
            "welcome-subtext"
        );
    if (
        !welcomeText ||
        !welcomeHeadline ||
        !welcomeSubtext
    ) {
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
        welcomeText.textContent =
            current.title;
        welcomeHeadline.textContent =
            current.headline;
        welcomeSubtext.textContent =
            current.text;
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