const welcomeMessages = [

    {
        title: "Willkommen",
        office: "In unserer Geschäftsstelle",
        city: "Düsseldorf",
        headline: "Schön, dass Sie bei uns sind.",
        text: "Wir wünschen Ihnen einen angenehmen Aufenthalt."
    },

    {
        title: "Welcome",
        office: "At our office in",
        city: "Düsseldorf",
        headline: "Welcome to Computacenter Düsseldorf.",
        text: "We wish you a pleasant stay."
    },

    {
        title: "Bienvenue",
        office: "Dans notre agence de",
        city: "Düsseldorf",
        headline: "Bienvenue chez Computacenter Düsseldorf.",
        text: "Nous vous souhaitons un agréable séjour."
    },

    {
        title: "Benvenuti",
        office: "Nella nostra sede di",
        city: "Düsseldorf",
        headline: "Benvenuti da Computacenter Düsseldorf.",
        text: "Vi auguriamo un piacevole soggiorno."
    },

    {
        title: "Witamy",
        office: "W naszym biurze w",
        city: "Düsseldorf",
        headline: "Witamy w Computacenter Düsseldorf.",
        text: "Życzymy miłego pobytu."
    },

    {
        title: "Добро пожаловать",
        office: "В нашем офисе в",
        city: "Дюссельдорфе",
        headline: "Добро пожаловать в Computacenter Düsseldorf.",
        text: "Желаем приятного пребывания."
    }

];

let welcomeIndex = 0;

function rotateWelcome() {

    const welcomeText =
        document.getElementById(
            "welcome-text"
        );

    const officeHeadline =
        document.getElementById(
            "office-headline"
        );

    const officeCity =
        document.getElementById(
            "office-city"
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
        !officeHeadline ||
        !officeCity ||
        !welcomeHeadline ||
        !welcomeSubtext
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

    welcomeText.textContent =
        current.title;

    officeHeadline.innerHTML =
        `${current.office}
         <span id="office-city">
             ${current.city}
         </span>`;

    welcomeHeadline.textContent =
        current.headline;

    welcomeSubtext.textContent =
        current.text;
}

setInterval(
    rotateWelcome,
    5000
);