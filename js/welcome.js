const welcomeMessages = [

    {
        eyebrow: "Herzlich willkommen",
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

    if (
        !eyebrow ||
        !location
    ) {
        return;
    }

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

    eyebrow.textContent =
        current.eyebrow;

    location.innerHTML =
        `${current.location}
        <span>
            ${current.city}
        </span>`;
}

setInterval(
    rotateWelcome,
    5000
);