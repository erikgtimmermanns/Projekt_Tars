export function updateDateTime() {
    const now = new Date();

    const dateElement = document.getElementById("date");
    const timeElement = document.getElementById("time");

    if (dateElement) {
        dateElement.textContent = new Intl.DateTimeFormat("de-DE", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }).format(now);
    }

    if (timeElement) {
        timeElement.textContent = new Intl.DateTimeFormat("de-DE", {
            hour: "2-digit",
            minute: "2-digit"
        }).format(now) + " Uhr";
    }
}

export function timeStringToMinutes(timeString) {
    const [hours, minutes] = String(timeString || "00:00").split(":").map(Number);
    return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

export function formatReceptionTime(timeString) {
    const [hours, minutes] = String(timeString || "00:00").split(":").map(Number);
    const date = new Date();
    date.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);

    return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(date) + " Uhr";
}

export function getReceptionState(now = new Date()) {
    const weekday = now.getDay(); // 0=Sunday, 6=Saturday
    const openingMinutes = timeStringToMinutes("08:00");
    const closingMinutes = timeStringToMinutes("18:00");
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const isWeekday = weekday >= 1 && weekday <= 5;

    if (!isWeekday) {
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + (weekday === 0 ? 1 : 2));
        nextDate.setHours(8, 0, 0, 0);

        return {
            isOpen: false,
            text: `Empfang geschlossen · öffnet ${new Intl.DateTimeFormat("de-DE", { weekday: "long" }).format(nextDate)} um 08:00 Uhr`
        };
    }

    if (currentMinutes >= openingMinutes && currentMinutes < closingMinutes) {
        return {
            isOpen: true,
            text: `Empfang geöffnet · schließt um ${formatReceptionTime("18:00")}`
        };
    }

    if (currentMinutes < openingMinutes) {
        return {
            isOpen: false,
            text: `Empfang geschlossen · öffnet heute um ${formatReceptionTime("08:00")}`
        };
    }

    const nextOpening = new Date(now);
    nextOpening.setDate(now.getDate() + 1);
    nextOpening.setHours(8, 0, 0, 0);

    while (nextOpening.getDay() === 0 || nextOpening.getDay() === 6) {
        nextOpening.setDate(nextOpening.getDate() + 1);
    }

    return {
        isOpen: false,
        text: `Empfang geschlossen · öffnet ${new Intl.DateTimeFormat("de-DE", { weekday: "long" }).format(nextOpening)} um 08:00 Uhr`
    };
}

export function updateReceptionStatus() {
    const receptionStatusElement = document.getElementById("reception-status");
    if (!receptionStatusElement) return;

    const state = getReceptionState(new Date());
    receptionStatusElement.textContent = state.text;
    receptionStatusElement.classList.toggle("open", state.isOpen);
    receptionStatusElement.classList.toggle("closed", !state.isOpen);
}

export function updateTimeOfDayTheme() {
    const hour = new Date().getHours();
    let mode = 'day';

    if (hour >= 5 && hour < 11) {
        mode = 'morning';
    } else if (hour >= 11 && hour < 17) {
        mode = 'day';
    } else if (hour >= 17 && hour < 21) {
        mode = 'evening';
    } else {
        mode = 'night';
    }

    document.body.classList.remove('time-morning', 'time-day', 'time-evening', 'time-night');
    document.body.classList.add('time-' + mode);
}
