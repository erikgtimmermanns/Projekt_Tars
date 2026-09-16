console.log("facts.js geladen");
const facts = [

    "Computacenter ist in über 20 Ländern vertreten.",

    "Computacenter gehört zu den führenden IT-Dienstleistern Europas.",

    "Computacenter arbeitet mit Microsoft, Lenovo und NVIDIA zusammen.",

    "Computacenter unterstützt Unternehmen bei der digitalen Transformation.",

    "Computacenter bietet Workplace-, Cloud- und Datacenter-Lösungen an."

];

let currentFact = 0;

function rotateFact() {
    const factElement =
        document.getElementById(
            "fact-text"
        );

    if (!factElement) {
        return;
    }

    currentFact++;

    if (
        currentFact >= facts.length
    ) {
        currentFact = 0;
    }

    factElement.textContent =
        facts[currentFact];

    console.log(
        "Neuer Fakt:",
        facts[currentFact]
    );
}

window.addEventListener(
    "load",
    () => {
        const factElement = document.getElementById("fact-text");
        if (!factElement) {
            return;
        }

        setInterval(
            rotateFact,
            5000
        );
    }
);