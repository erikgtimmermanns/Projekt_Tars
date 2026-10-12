console.log("facts.js geladen");
const facts = [

    "Firma ist in über 20 Ländern vertreten.",

    "Firma gehört zu den führenden IT-Dienstleistern Europas.",

    "Firma arbeitet mit Microsoft, Lenovo und NVIDIA zusammen.",

    "Firma unterstützt Unternehmen bei der digitalen Transformation.",

    "Firma bietet Workplace-, Cloud- und Datacenter-Lösungen an."

];

let currentFact = 0;

export function rotateFact() {
    const factElement = document.getElementById("fact-text");
    if (!factElement) return;

    currentFact++;
    if (currentFact >= facts.length) currentFact = 0;
    factElement.textContent = facts[currentFact];
    console.log("Neuer Fakt:", facts[currentFact]);
}

export function initFacts(intervalMs = 5000) {
    // render immediately if element exists
    rotateFact();
    return setInterval(rotateFact, intervalMs);
}