const facts = [

    "Computacenter ist in über 20 Ländern vertreten.",

    "Computacenter gehört zu den führenden IT-Dienstleistern Europas.",

    "Computacenter unterstützt Unternehmen bei Cloud-, Workplace- und Datacenter-Lösungen.",

    "Computacenter arbeitet mit führenden Technologiepartnern wie Microsoft, Lenovo und NVIDIA zusammen.",

    "Computacenter bietet Dienstleistungen entlang des gesamten IT-Lebenszyklus an.",

    "Computacenter unterstützt Kunden weltweit bei der digitalen Transformation.",

    "Computacenter Deutschland betreibt zahlreiche Geschäftsstellen in Deutschland.",

    "Computacenter verbindet Technologie, Service und Innovation."
];

let factIndex = 0;

function rotateFact() {

    const fact =
        document.getElementById(
            "fact-text"
        );

    if (!fact) {
        return;
    }

    fact.style.opacity = 0;

    setTimeout(() => {

        factIndex++;

        if (
            factIndex >= facts.length
        ) {
            factIndex = 0;
        }

        fact.textContent =
            facts[factIndex];

        fact.style.opacity = 1;

    }, 500);
}

setInterval(
    rotateFact,
    8000
);