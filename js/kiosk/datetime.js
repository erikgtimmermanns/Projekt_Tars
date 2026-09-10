export function updateDateTime() {
    const now = new Date();
    const dateElement = document.getElementById("date");
    const timeElement = document.getElementById("time");

    const formattedDate = new Intl.DateTimeFormat("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(now);

    const formattedTime = new Intl.DateTimeFormat("de-DE", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(now);

    if (dateElement) {
        dateElement.textContent = formattedDate;
    }

    if (timeElement) {
        timeElement.textContent = formattedTime + " Uhr";
    }
}